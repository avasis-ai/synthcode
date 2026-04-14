import type { Message, ContentBlock, ToolUseBlock, LoopEvent, ToolContext, TokenUsage } from "./types.js";
import { DEFAULT_MAX_TURNS } from "./types.js";
import { ToolRegistry } from "./tools/registry.js";
import { orchestrateTools, type OrchestrateOptions } from "./tools/orchestrator.js";
import { ToolVerifier } from "./tools/verifier.js";
import type { DualPathVerifier } from "./verify/router.js";
import { ContextManager } from "./context/manager.js";
import { PermissionEngine } from "./permissions/engine.js";
import type { Provider } from "./llm/provider.js";
import type { AgentHooks } from "./hooks.js";
import { HookRunner } from "./hooks.js";
import type { CostTracker } from "./cost/tracker.js";

const DEFAULT_MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const DOOM_LOOP_THRESHOLD = 3;
const PRE_OVERFLOW_BUFFER = 20_000;
const OUTPUT_MAX_LINES = 2000;
const OUTPUT_MAX_BYTES = 50_000;

export interface AgentLoopConfig {
  model: Provider;
  tools: ToolRegistry;
  messages: Message[];
  systemPrompt?: string;
  maxTurns?: number;
  contextManager: ContextManager;
  permissionEngine: PermissionEngine;
  cwd?: string;
  abortSignal?: AbortSignal;
  maxRetries?: number;
  hooks?: AgentHooks;
  costTracker?: CostTracker;
  verifier?: ToolVerifier;
  dualPathVerifier?: DualPathVerifier;
}

function parseRetryAfterMs(error: Error): number | null {
  const msg = error.message ?? "";
  const retryAfterMsMatch = msg.match(/retry-after-ms:\s*(\d+)/i);
  if (retryAfterMsMatch) return parseInt(retryAfterMsMatch[1], 10);
  const retryAfterMatch = msg.match(/retry-after:\s*(\d+)/i);
  if (retryAfterMatch) return parseInt(retryAfterMatch[1], 10) * 1000;
  return null;
}

function truncateOutput(output: string, toolName: string, hasSubAgent: boolean): string {
  const lines = output.split("\n");
  if (lines.length <= OUTPUT_MAX_LINES && output.length <= OUTPUT_MAX_BYTES) return output;

  let truncated = "";
  let byteCount = 0;
  for (const line of lines) {
    if (byteCount + line.length > OUTPUT_MAX_BYTES) break;
    truncated += line + "\n";
    byteCount += line.length;
    if (byteCount > OUTPUT_MAX_BYTES) break;
  }

  const lineCount = truncated.split("\n").filter(l => l.length > 0).length;
  const suffix = hasSubAgent
    ? `\n\n[Output truncated: ${lineCount}/${lines.length} lines shown. Use the Task tool to have a sub-agent process the full output.]`
    : `\n\n[Output truncated: ${lineCount}/${lines.length} lines shown. Use Grep to search or Read with offset/limit for the full content.]`;

  return truncated.trimEnd() + suffix;
}

export function detectDoomLoop(messages: Message[]): ToolUseBlock | null {
  const recentToolCalls: ToolUseBlock[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    if (typeof msg.content === "string") continue;
    for (const block of msg.content) {
      if (block.type === "tool_use") recentToolCalls.push(block);
    }
    if (recentToolCalls.length >= DOOM_LOOP_THRESHOLD) break;
  }

  if (recentToolCalls.length < DOOM_LOOP_THRESHOLD) return null;

  const last = recentToolCalls[0];
  return recentToolCalls.every(
    tc => tc.name === last.name && JSON.stringify(tc.input) === JSON.stringify(last.input),
  )
    ? last
    : null;
}

export async function* agentLoop(config: AgentLoopConfig): AsyncGenerator<LoopEvent> {
  const {
    model,
    tools,
    messages,
    systemPrompt,
    maxTurns = DEFAULT_MAX_TURNS,
    contextManager,
    permissionEngine,
    cwd = process.cwd(),
    abortSignal,
    hooks,
    costTracker,
    verifier,
    dualPathVerifier,
  } = config;

  const hookRunner = new HookRunner(hooks);
  const context: ToolContext = { cwd, env: { ...process.env } as Record<string, string> };
  let turns = 0;
  let consecutiveRetries = 0;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  let totalUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  let inFlightText = "";
  let inFlightReasoning = "";
  let inFlightToolCalls: ToolUseBlock[] = [];

  while (turns < maxTurns) {
    if (abortSignal?.aborted) {
      yield finalizeLoop("Aborted");
      return;
    }

    const messagesAfterHook = await hookRunner.runOnTurnStart(turns + 1, messages);
    if (messagesAfterHook !== messages) {
      messages.length = 0;
      messages.push(...messagesAfterHook);
    }

    const contextCheck = contextManager.check(messages);
    if (contextCheck.needsCompact) {
      const result = await contextManager.compact(messages);
      messages.length = 0;
      messages.push(...result.messages);
      if (result.tokensSaved > 0) {
        const thinking = `Context ${result.method}: saved ~${result.tokensSaved} tokens (${contextCheck.totalTokens} → ${contextCheck.totalTokens - result.tokensSaved})`;
        yield { type: "thinking", thinking };
        await hookRunner.runOnCompact(result);
      }
      const pruned = contextManager.pruneToolOutputs(messages);
      if (pruned.length !== messages.length) {
        messages.length = 0;
        messages.push(...pruned);
        yield { type: "thinking", thinking: "Pruned large tool outputs to free additional context" };
      }
    }

    const estimatedTotal = totalUsage.inputTokens + totalUsage.outputTokens
      + (totalUsage.cacheReadTokens ?? 0) + (totalUsage.cacheWriteTokens ?? 0);
    const maxContext = contextManager.maxTokens;
    const maxOutput = contextManager.maxOutputTokens;
    if (maxContext > 0 && estimatedTotal + maxOutput + PRE_OVERFLOW_BUFFER >= maxContext) {
      yield { type: "thinking", thinking: "Approaching context limit, compacting preemptively..." };
      const result = await contextManager.compact(messages);
      messages.length = 0;
      messages.push(...result.messages);
      if (result.tokensSaved > 0) {
        yield { type: "thinking", thinking: `Pre-overflow compact: freed ~${result.tokensSaved} tokens` };
      }
    }

    const available = contextManager.getAvailableTokens(messages);
    const maxTokens = Math.min(available, contextManager.maxOutputTokens);
    if (maxTokens < 1024) {
      yield finalizeLoop("Insufficient context window for next turn");
      return;
    }

    inFlightText = "";
    inFlightReasoning = "";
    inFlightToolCalls = [];

    let response;
    try {
      const mappedMessages = messages.map((m) => {
        if (m.role === "tool") {
          const toolCall = inFlightToolCalls.find(tc => tc.id === (m as { tool_use_id?: string }).tool_use_id);
          if (toolCall) {
            return {
              role: "tool" as const,
              tool_use_id: m.role === "tool" ? (m as { tool_use_id: string }).tool_use_id : undefined,
              is_error: m.role === "tool" ? (m as { is_error?: boolean }).is_error : undefined,
              content: truncateOutput(
                (m as { content: string }).content,
                toolCall.name,
                tools.has("delegate_agent"),
              ),
            };
          }
        }
        return {
          role: m.role,
          content: m.role === "tool"
            ? (m as { content: string }).content
            : m.role === "user"
              ? (m as { content: string }).content
              : (m as { content: ContentBlock[] }).content,
          tool_use_id: m.role === "tool" ? (m as { tool_use_id: string }).tool_use_id : undefined,
          is_error: m.role === "tool" ? (m as { is_error?: boolean }).is_error : undefined,
        };
      });

      response = await model.chat({
        messages: mappedMessages,
        tools: tools.getAPI(),
        systemPrompt,
        maxOutputTokens: maxTokens,
        abortSignal,
      });
    } catch (err) {
      yield* flushInFlight();
      const error = err instanceof Error ? err : new Error(String(err));

      const hookResult = await hookRunner.runOnError(error, turns + 1);
      if (hookResult.retry && hookResult.message) {
        messages.push({ role: "user", content: hookResult.message });
        turns++;
        continue;
      }

      if (error.message.includes("429") || error.message.includes("529") || error.message.includes("overloaded")) {
        consecutiveRetries++;
        if (consecutiveRetries > maxRetries) {
          yield { type: "error", error: new Error(`Max retries (${maxRetries}) exceeded`) };
          return;
        }
        const headerDelay = parseRetryAfterMs(error);
        const backoffDelay = headerDelay
          ?? Math.min(INITIAL_RETRY_DELAY_MS * 2 ** (consecutiveRetries - 1) + Math.random() * 500, MAX_RETRY_DELAY_MS);
        yield { type: "thinking", thinking: `Rate limited, retry ${consecutiveRetries}/${maxRetries} in ${Math.round(backoffDelay)}ms...` };
        await new Promise((r) => setTimeout(r, backoffDelay));
        continue;
      }

      yield { type: "error", error };
      return;
    }

    totalUsage.inputTokens += response.usage.inputTokens;
    totalUsage.outputTokens += response.usage.outputTokens;
    totalUsage.cacheReadTokens = (totalUsage.cacheReadTokens ?? 0) + (response.usage.cacheReadTokens ?? 0);
    totalUsage.cacheWriteTokens = (totalUsage.cacheWriteTokens ?? 0) + (response.usage.cacheWriteTokens ?? 0);

    if (costTracker) {
      costTracker.record(model.model, response.usage, turns + 1);
    }

    const toolCalls: ToolUseBlock[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        inFlightText += block.text;
        yield { type: "text", text: block.text };
      } else if (block.type === "thinking") {
        inFlightReasoning += block.thinking;
        yield { type: "thinking", thinking: block.thinking };
      } else if (block.type === "tool_use") {
        const resolvedName = tools.has(block.name) ? block.name : tools.findCaseInsensitive(block.name);
        if (!resolvedName) {
          yield { type: "tool_result", id: block.id, name: block.name, output: `Unknown tool: ${block.name}. Available: ${tools.listNames().join(", ")}`, isError: true };
          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "tool", tool_use_id: block.id, content: `Unknown tool: ${block.name}`, is_error: true });
          continue;
        }
        const modifiedBlock: ToolUseBlock = resolvedName !== block.name ? { ...block, name: resolvedName } : block;

        const hookToolResult = await hookRunner.runOnToolUse(modifiedBlock.name, modifiedBlock.input);
        if (!hookToolResult.allow) {
          yield { type: "tool_result", id: modifiedBlock.id, name: modifiedBlock.name, output: "Tool denied by hook", isError: true };
          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "tool", tool_use_id: modifiedBlock.id, content: "Tool denied by hook", is_error: true });
          continue;
        }
        const finalBlock: ToolUseBlock = { ...modifiedBlock, input: hookToolResult.input };
        toolCalls.push(finalBlock);
        inFlightToolCalls.push(finalBlock);
        yield { type: "tool_use", id: finalBlock.id, name: finalBlock.name, input: finalBlock.input };
      }
    }

    const hasNonToolContent = inFlightText.length > 0 || inFlightReasoning.length > 0;
    if (!hasNonToolContent && toolCalls.length === 0) {
      yield finalizeLoop("Assistant produced no content");
      return;
    }

    const assistantContent = response.content.filter(b => {
      if (b.type !== "tool_use") return true;
      return toolCalls.some(tc => tc.id === b.id);
    });

    messages.push({ role: "assistant", content: assistantContent });
    turns++;
    consecutiveRetries = 0;
    inFlightText = "";
    inFlightReasoning = "";
    inFlightToolCalls = [];

    await hookRunner.runOnTurnEnd(turns, messages);

    if (response.stopReason !== "tool_use" || toolCalls.length === 0) {
      yield {
        type: "done",
        usage: {
          inputTokens: totalUsage.inputTokens,
          outputTokens: totalUsage.outputTokens,
          cacheReadTokens: totalUsage.cacheReadTokens,
          cacheWriteTokens: totalUsage.cacheWriteTokens,
        },
        messages: [...messages],
      };
      return;
    }

    const doomLoopCall = detectDoomLoop(messages);
    if (doomLoopCall) {
      yield { type: "thinking", thinking: `Detected repetitive tool calls: ${doomLoopCall.name} called ${DOOM_LOOP_THRESHOLD} times with identical input. Breaking the loop.` };
      messages.push({ role: "user", content: `STOP. You have called ${doomLoopCall.name} ${DOOM_LOOP_THRESHOLD} times in a row with the same input. This indicates a loop. Try a different approach or tool.` });
      turns++;
      continue;
    }

    const orchestrateOptions: OrchestrateOptions = {
      verifier,
      dualPathVerifier,
      previousToolCalls: collectPreviousToolCalls(messages),
      turnCount: turns,
    };

    const results = await orchestrateTools(
      tools,
      toolCalls,
      context,
      async (name, _input) => {
        const perm = permissionEngine.check(name);
        return perm.allowed;
      },
      abortSignal,
      orchestrateOptions,
    );

    for (const result of results) {
      let output = truncateOutput(result.output, result.name, tools.has("delegate_agent"));
      const toolResult = await hookRunner.runOnToolResult({
        id: result.id,
        name: result.name,
        output: result.output,
        isError: result.isError,
        durationMs: result.durationMs,
      });
      output = toolResult;

      messages.push({
        role: "tool",
        tool_use_id: result.id,
        content: output,
        is_error: result.isError,
      });
      yield {
        type: "tool_result",
        id: result.id,
        name: result.name,
        output,
        isError: result.isError,
      };
    }
  }

  yield { type: "error", error: new Error(`Max turns (${maxTurns}) reached`) };

  function collectPreviousToolCalls(msgs: Message[]): Array<{ name: string; input: Record<string, unknown> }> {
    const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
    for (const m of msgs) {
      if (m.role !== "assistant") continue;
      if (typeof m.content === "string") continue;
      for (const block of m.content) {
        if (block.type === "tool_use") {
          calls.push({ name: block.name, input: block.input });
        }
      }
    }
    return calls;
  }

  function* flushInFlight(): Generator<LoopEvent, void, unknown> {
    if (inFlightText.length > 0) {
      yield { type: "text", text: inFlightText };
    }
    if (inFlightReasoning.length > 0) {
      yield { type: "thinking", thinking: inFlightReasoning };
    }
    for (const tc of inFlightToolCalls) {
      yield { type: "tool_result", id: tc.id, name: tc.name, output: "[Tool execution was interrupted]", isError: true };
      messages.push({ role: "assistant", content: [{ type: "tool_use" as const, id: tc.id, name: tc.name, input: tc.input }] });
      messages.push({ role: "tool", tool_use_id: tc.id, content: "[Tool execution was interrupted]", is_error: true });
    }
  }

  function finalizeLoop(reason: string): LoopEvent {
    if (totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0) {
      return {
        type: "done",
        usage: {
          inputTokens: totalUsage.inputTokens,
          outputTokens: totalUsage.outputTokens,
          cacheReadTokens: totalUsage.cacheReadTokens,
          cacheWriteTokens: totalUsage.cacheWriteTokens,
        },
        messages: [...messages],
      };
    }
    return { type: "error", error: new Error(reason) };
  }
}
