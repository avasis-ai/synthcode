import type { Message, LoopEvent, AgentConfig, PermissionConfig } from "./types.js";
import { DEFAULT_MAX_TURNS, DEFAULT_CONTEXT_WINDOW, DEFAULT_MAX_OUTPUT_TOKENS, DEFAULT_COMPACT_THRESHOLD } from "./types.js";
import { agentLoop } from "./loop.js";
import { ToolRegistry } from "./tools/registry.js";
import { defineTool } from "./tools/tool.js";
import type { Tool } from "./tools/tool.js";
import { ContextManager } from "./context/manager.js";
import { PermissionEngine } from "./permissions/engine.js";
import type { Provider } from "./llm/provider.js";
import type { AgentHooks } from "./hooks.js";
import { HookRunner } from "./hooks.js";
import type { MemoryStore } from "./memory/store.js";
import type { CostTracker } from "./cost/tracker.js";
import { CostTracker as CostTrackerImpl } from "./cost/tracker.js";

export interface AgentConfigV2 extends AgentConfig {
  hooks?: AgentHooks;
  memory?: MemoryStore;
  threadId?: string;
  costTracker?: CostTracker;
  title?: string;
  disableTitle?: boolean;
}

export class Agent {
  private model: Provider;
  private tools: ToolRegistry;
  private systemPrompt: string;
  private maxTurns: number;
  private contextManager: ContextManager;
  private permissionEngine: PermissionEngine;
  private permissionConfig?: PermissionConfig;
  private cwd: string;
  private maxRetries: number;
  private messages: Message[] = [];
  private hooks?: AgentHooks;
  private memory?: MemoryStore;
  private threadId?: string;
  private costTracker: CostTracker;
  private _loaded = false;
  private _title?: string;
  private _titleFetched = false;
  private _disableTitle = false;

  constructor(config: AgentConfig | AgentConfigV2) {
    this.model = config.model;
    this.tools = new ToolRegistry(config.tools ?? []);
    this.systemPrompt = config.systemPrompt ?? "";
    this.maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;
    this.contextManager = new ContextManager({
      maxTokens: config.context?.maxTokens ?? DEFAULT_CONTEXT_WINDOW,
      maxOutputTokens: config.context?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      compactThreshold: config.context?.compactThreshold ?? DEFAULT_COMPACT_THRESHOLD,
    });
    this.permissionEngine = new PermissionEngine(config.permissions);
    this.permissionConfig = config.permissions;
    this.cwd = config.cwd ?? process.cwd();
    this.maxRetries = config.maxRetries ?? 5;

    const v2 = config as AgentConfigV2;
    this.hooks = v2.hooks;
    this.memory = v2.memory;
    this.threadId = v2.threadId;
    this.costTracker = v2.costTracker ?? new CostTrackerImpl();
    this._title = v2.title;
    this._disableTitle = v2.disableTitle ?? false;
  }

  addTool(tool: Tool): void {
    this.tools.add(tool);
  }

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  reset(): void {
    this.messages = [];
    this._titleFetched = false;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getCostTracker(): CostTracker {
    return this.costTracker;
  }

  get title(): string | undefined {
    return this._title;
  }

  private async loadMemory(): Promise<void> {
    if (this._loaded || !this.memory || !this.threadId) return;
    const stored = await this.memory.getThread(this.threadId);
    if (stored.length > 0) {
      this.messages = stored;
    }
    this._loaded = true;
  }

  private async saveMemory(): Promise<void> {
    if (!this.memory || !this.threadId) return;
    await this.memory.saveThread(this.threadId, this.messages);
  }

  fork(newThreadId?: string): Agent {
    const forked = new Agent({
      model: this.model,
      tools: this.tools.getAll(),
      systemPrompt: this.systemPrompt,
      maxTurns: this.maxTurns,
      cwd: this.cwd,
      maxRetries: this.maxRetries,
      permissions: this.permissionConfig,
      hooks: this.hooks,
      memory: this.memory,
      threadId: newThreadId,
      costTracker: this.costTracker,
      title: this._title,
      context: {
        maxTokens: this.contextManager.maxTokens,
        maxOutputTokens: this.contextManager.maxOutputTokens,
        compactThreshold: this.contextManager.compactThreshold,
      },
    });
    forked.messages = [...this.messages];
    return forked;
  }

  async *run(prompt: string, options?: { abortSignal?: AbortSignal }): AsyncGenerator<LoopEvent> {
    await this.loadMemory();
    const loopMessages = [...this.messages, { role: "user" as const, content: prompt }];

    if (!this._titleFetched && this.messages.length === 0 && !this._disableTitle) {
      this._titleFetched = true;
      this.generateTitle(prompt).catch(() => {});
    }

    const loop = agentLoop({
      model: this.model,
      tools: this.tools,
      messages: loopMessages,
      systemPrompt: this.systemPrompt || undefined,
      maxTurns: this.maxTurns,
      contextManager: this.contextManager,
      permissionEngine: this.permissionEngine,
      cwd: this.cwd,
      abortSignal: options?.abortSignal,
      maxRetries: this.maxRetries,
      hooks: this.hooks,
      costTracker: this.costTracker,
    });

    const finalMessages: Message[] = [];
    for await (const event of loop) {
      yield event;
      if (event.type === "done") {
        finalMessages.length = 0;
        finalMessages.push(...event.messages);
      }
    }

    if (finalMessages.length > 0) {
      this.messages = finalMessages;
      await this.saveMemory();
    }
  }

  async chat(prompt: string, options?: { abortSignal?: AbortSignal }): Promise<{
    text: string;
    usage: { inputTokens: number; outputTokens: number };
    messages: Message[];
    cost: number;
  }> {
    let text = "";
    let usage = { inputTokens: 0, outputTokens: 0 };

    for await (const event of this.run(prompt, options)) {
      if (event.type === "text") {
        text += event.text;
      }
      if (event.type === "done") {
        usage = {
          inputTokens: event.usage.inputTokens,
          outputTokens: event.usage.outputTokens,
        };
      }
    }

    const total = this.costTracker.getTotal();
    return { text, usage, messages: this.getMessages(), cost: total.cost };
  }

  async structured<T>(
    prompt: string,
    schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } },
    options?: { abortSignal?: AbortSignal; maxRetries?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentPrompt = attempt === 0
        ? prompt
        : `${prompt}\n\nPrevious attempt returned invalid JSON. Please fix and respond with valid JSON only.`;

      const agent = new Agent({
        model: this.model,
        tools: [],
        systemPrompt: "You must respond with valid JSON matching the requested schema.",
        maxTurns: 1,
        cwd: this.cwd,
        permissions: this.permissionConfig,
        context: {
          maxTokens: this.contextManager.maxTokens,
          maxOutputTokens: this.contextManager.maxOutputTokens,
          compactThreshold: this.contextManager.compactThreshold,
        },
        costTracker: this.costTracker,
        disableTitle: true,
      } as AgentConfigV2);

      const result = await agent.chat(currentPrompt, options);
      const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, result.text];
      const jsonStr = jsonMatch[1] ?? result.text;

      try {
        const parsed = JSON.parse(jsonStr);
        const validated = schema.safeParse(parsed);
        if (validated.success && validated.data !== undefined) {
          return validated.data as T;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Failed to get valid structured output after ${maxRetries} attempts`);
  }

  async structuredViaTool<T>(
    prompt: string,
    schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } },
    options?: { abortSignal?: AbortSignal; maxRetries?: number },
  ): Promise<T> {
    const { z } = await import("zod");
    const maxRetries = options?.maxRetries ?? 3;

    let captured: T | undefined;

    const structTool = defineTool({
      name: "structured_output",
      description: "Return your final response in the required structured format.",
      inputSchema: z.object({
        response: z.unknown().describe("The structured JSON response"),
      }),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async (input: Record<string, unknown>) => {
        captured = input.response as T;
        return "Structured output captured.";
      },
    });

    const agent = new Agent({
      model: this.model,
      tools: [structTool],
      systemPrompt: [
        this.systemPrompt,
        "You MUST call the structured_output tool with your response. Do not return plain text.",
      ].filter(Boolean).join("\n\n"),
      maxTurns: 1,
      cwd: this.cwd,
      permissions: this.permissionConfig,
      context: {
        maxTokens: this.contextManager.maxTokens,
        maxOutputTokens: this.contextManager.maxOutputTokens,
        compactThreshold: this.contextManager.compactThreshold,
      },
      costTracker: this.costTracker,
      disableTitle: true,
    } as AgentConfigV2);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      captured = undefined;
      const currentPrompt = attempt === 0
        ? prompt
        : `${prompt}\n\nPrevious attempt failed validation. Fix your structured output and call the structured_output tool again.`;

      await agent.chat(currentPrompt, options);

      if (captured !== undefined) {
        const validated = schema.safeParse(captured);
        if (validated.success && validated.data !== undefined) {
          return validated.data as T;
        }
      }
    }

    throw new Error(`Failed to get valid structured output via tool after ${maxRetries} attempts`);
  }

  async asTool(options?: { allowSubAgents?: boolean; name?: string; description?: string }): Promise<Tool> {
    const { z } = await import("zod");
    const allowSubAgents = options?.allowSubAgents ?? false;
    return defineTool({
      name: options?.name ?? "delegate_agent",
      description: options?.description ?? `Delegate a task to a sub-agent with system prompt: ${this.systemPrompt?.slice(0, 100) ?? "none"}`,
      inputSchema: z.object({
        prompt: z.string().describe("The task to delegate"),
      }),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async (input: Record<string, unknown>) => {
        const subAgent = this.fork();
        if (!allowSubAgents) {
          const forbiddenTools = ["delegate_agent", "task", "todowrite"];
          const allowed = this.tools.getAll().filter((t) => !forbiddenTools.includes(t.name));
          for (const tool of allowed) {
            subAgent.addTool(tool);
          }
        }
        const result = await subAgent.chat(input.prompt as string);
        return result.text;
      },
    });
  }

  private async generateTitle(prompt: string): Promise<void> {
    try {
      const firstLine = prompt.split("\n")[0].slice(0, 200);
      const titleAgent = new Agent({
        model: this.model,
        tools: [],
        systemPrompt: "Generate a short, descriptive title (max 10 words) for a conversation that starts with this message. Return ONLY the title, nothing else.",
        maxTurns: 1,
        cwd: this.cwd,
        costTracker: this.costTracker,
        disableTitle: true,
      } as AgentConfigV2);
      const result = await titleAgent.chat(firstLine);
      const title = result.text.trim().replace(/^["']|["']$/g, "").slice(0, 80);
      if (title.length > 0) {
        this._title = title;
      }
    } catch {
      this._title = prompt.slice(0, 50);
    }
  }
}
