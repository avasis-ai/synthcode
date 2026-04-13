import { describe, it, expect } from "vitest";
import { z } from "zod";
import { estimateTokens, estimateMessageTokens, estimateConversationTokens } from "../src/context/tokenizer.js";
import { ContextManager } from "../src/context/manager.js";
import { ToolRegistry } from "../src/tools/registry.js";
import { defineTool } from "../src/tools/tool.js";
import { PermissionEngine } from "../src/permissions/engine.js";
import { fuzzyReplace, fuzzyContains, FuzzyEditError } from "../src/tools/fuzzy-edit.js";
import { CircuitBreaker } from "../src/circuit-breaker.js";
import { orchestrateTools } from "../src/tools/orchestrator.js";
import type { Tool, APIToolDefinition } from "../src/tools/tool.js";
import type { ToolContext, ToolUseBlock, Message } from "../src/types.js";
import { createStreamAggregator } from "../src/stream.js";

interface BenchResult {
  opsPerSec: number;
  avgMs: number;
}

function benchmark(fn: () => void, iterations: number): BenchResult {
  for (let w = 0; w < Math.min(iterations, Math.max(50, Math.floor(iterations * 0.1))); w++) {
    fn();
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsed = performance.now() - start;
  const avgMs = elapsed / iterations;
  const opsPerSec = 1000 / avgMs;
  return { opsPerSec, avgMs };
}

function makeUserMessage(i: number): Message {
  return { role: "user", content: `Message number ${i} with enough text to simulate a realistic conversation exchange.` };
}

function makeAssistantMessage(i: number): Message {
  return {
    role: "assistant",
    content: [
      { type: "text", text: `Response to message ${i}. Here is some analysis and reasoning about the task.` },
      { type: "tool_use", id: `tool_${i}`, name: "bash", input: { command: `echo ${i}` } },
    ],
  };
}

function makeToolResultMessage(i: number): Message {
  return { role: "tool", tool_use_id: `tool_${i}`, content: `Output line 1\nOutput line 2\nResult: ${i}` };
}

function generateConversation(count: number): Message[] {
  const messages: Message[] = [];
  for (let i = 0; i < count; i++) {
    messages.push(makeUserMessage(i));
    messages.push(makeAssistantMessage(i));
    messages.push(makeToolResultMessage(i));
  }
  return messages;
}

function makeMockTool(name: string, readOnly = false, concurrencySafe = false): Tool {
  return defineTool({
    name,
    description: `Mock tool ${name}`,
    inputSchema: z.object({ value: z.string() }),
    isReadOnly: readOnly,
    isConcurrencySafe: concurrencySafe,
    execute: async ({ value }) => `result:${value}`,
  });
}

const TOOL_CONTEXT: ToolContext = { cwd: "/tmp", env: {} };

function makeToolUseBlock(id: string, name: string, input: Record<string, unknown> = {}): ToolUseBlock {
  return { type: "tool_use", id, name, input };
}

describe("Benchmark Suite", () => {
  describe("1. Token Estimation Throughput", () => {
    it("should estimate tokens on short text at high throughput", () => {
      const text = "Hello, world! This is a simple test message for token estimation.";
      const result = benchmark(() => estimateTokens(text), 50000);
      expect(result.opsPerSec).toBeGreaterThan(100000);
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should estimate tokens on 10KB text efficiently", () => {
      const text = "a".repeat(10 * 1024);
      const result = benchmark(() => estimateTokens(text), 20000);
      expect(result.opsPerSec).toBeGreaterThan(10000);
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should estimate tokens on 100KB text efficiently", () => {
      const text = "word ".repeat(20_000);
      const result = benchmark(() => estimateTokens(text), 5000);
      expect(result.opsPerSec).toBeGreaterThan(1000);
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should estimate message tokens for user messages at high throughput", () => {
      const msg: Message = { role: "user", content: "This is a user message with some content." };
      const result = benchmark(() => estimateMessageTokens(msg), 50000);
      expect(result.opsPerSec).toBeGreaterThan(50000);
      expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
    });

    it("should estimate message tokens for assistant messages with tool_use", () => {
      const msg: Message = {
        role: "assistant",
        content: [
          { type: "text", text: "Let me run that command." },
          { type: "tool_use", id: "1", name: "bash", input: { command: "ls -la" } },
          { type: "thinking", thinking: "I should list the files first." },
        ],
      };
      const result = benchmark(() => estimateMessageTokens(msg), 50000);
      expect(result.opsPerSec).toBeGreaterThan(10000);
      expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
    });

    it("should estimate conversation tokens across mixed messages", () => {
      const messages = generateConversation(10);
      const result = benchmark(() => estimateConversationTokens(messages), 20000);
      expect(result.opsPerSec).toBeGreaterThan(5000);
      const tokens = estimateConversationTokens(messages);
      expect(tokens.total).toBeGreaterThan(0);
      expect(tokens.byRole.user).toBeGreaterThan(0);
      expect(tokens.byRole.assistant).toBeGreaterThan(0);
      expect(tokens.byRole.tool).toBeGreaterThan(0);
    });
  });

  describe("2. Context Check Speed", () => {
    it("should check 100 messages efficiently", () => {
      const messages = generateConversation(34);
      expect(messages.length).toBeGreaterThanOrEqual(100);
      const manager = new ContextManager({ maxTokens: 200000, maxOutputTokens: 16384 });
      const result = benchmark(() => manager.check(messages), 10000);
      expect(result.opsPerSec).toBeGreaterThan(1000);
      const check = manager.check(messages);
      expect(check.totalTokens).toBeGreaterThan(0);
      expect(typeof check.needsCompact).toBe("boolean");
    });

    it("should check 500 messages efficiently", () => {
      const messages = generateConversation(167);
      expect(messages.length).toBeGreaterThanOrEqual(500);
      const manager = new ContextManager({ maxTokens: 200000, maxOutputTokens: 16384 });
      const result = benchmark(() => manager.check(messages), 2000);
      expect(result.opsPerSec).toBeGreaterThan(200);
      const check = manager.check(messages);
      expect(check.totalTokens).toBeGreaterThan(0);
    });

    it("should check 1000 messages efficiently", () => {
      const messages = generateConversation(334);
      expect(messages.length).toBeGreaterThanOrEqual(1000);
      const manager = new ContextManager({ maxTokens: 200000, maxOutputTokens: 16384 });
      const result = benchmark(() => manager.check(messages), 500);
      expect(result.opsPerSec).toBeGreaterThan(50);
      const check = manager.check(messages);
      expect(check.totalTokens).toBeGreaterThan(0);
    });
  });

  describe("3. Tool Registry Lookup", () => {
    it("should lookup among 1K tools efficiently", () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 1000; i++) {
        registry.add(makeMockTool(`tool_${i}`));
      }
      expect(registry.size).toBe(1000);
      const result = benchmark(() => {
        for (let i = 0; i < 1000; i++) {
          registry.get(`tool_${i}`);
        }
      }, 1000);
      expect(result.opsPerSec).toBeGreaterThan(100);
      expect(registry.get("tool_0")).toBeDefined();
      expect(registry.get("tool_999")).toBeDefined();
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    it("should lookup among 10K tools efficiently", () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 10000; i++) {
        registry.add(makeMockTool(`tool_${i}`));
      }
      expect(registry.size).toBe(10000);
      const result = benchmark(() => {
        for (let i = 0; i < 1000; i++) {
          registry.get(`tool_${i * 10}`);
        }
      }, 500);
      expect(result.opsPerSec).toBeGreaterThan(50);
      expect(registry.get("tool_5000")).toBeDefined();
    });

    it("should lookup among 50K tools efficiently", () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 50000; i++) {
        registry.add(makeMockTool(`tool_${i}`));
      }
      expect(registry.size).toBe(50000);
      const result = benchmark(() => {
        for (let i = 0; i < 500; i++) {
          registry.get(`tool_${i * 100}`);
        }
      }, 100);
      expect(result.opsPerSec).toBeGreaterThan(10);
      expect(registry.get("tool_25000")).toBeDefined();
    });

    it("should perform case-insensitive lookup", () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 1000; i++) {
        registry.add(makeMockTool(`tool_${i}`));
      }
      const result = benchmark(() => {
        registry.findCaseInsensitive("TOOL_500");
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(100);
      expect(registry.findCaseInsensitive("TOOL_500")).toBe("tool_500");
      expect(registry.findCaseInsensitive("nonexistent")).toBeUndefined();
    });
  });

  describe("4. Permission Check", () => {
    it("should check against 1K patterns efficiently", () => {
      const allowed: string[] = [];
      const denied: string[] = [];
      for (let i = 0; i < 500; i++) {
        allowed.push(`tool_${i}`);
        denied.push(`deny_${i}`);
      }
      const engine = new PermissionEngine({
        allowedTools: allowed,
        deniedTools: denied,
        defaultAction: "allow",
      });
      const result = benchmark(() => {
        engine.check("tool_250");
        engine.check("deny_250");
        engine.check("unknown_tool");
      }, 10000);
      expect(result.opsPerSec).toBeGreaterThan(500);
      expect(engine.check("tool_250").allowed).toBe(true);
      expect(engine.check("deny_250").allowed).toBe(false);
      expect(engine.check("unknown_tool").allowed).toBe(true);
    });

    it("should check against 10K patterns efficiently", () => {
      const allowed: string[] = [];
      const denied: string[] = [];
      for (let i = 0; i < 5000; i++) {
        allowed.push(`tool_${i}`);
        denied.push(`deny_${i}`);
      }
      const engine = new PermissionEngine({
        allowedTools: allowed,
        deniedTools: denied,
        defaultAction: "allow",
      });
      const result = benchmark(() => {
        engine.check("tool_2500");
        engine.check("deny_2500");
        engine.check("unknown_tool");
      }, 2000);
      expect(result.opsPerSec).toBeGreaterThan(50);
      expect(engine.check("tool_2500").allowed).toBe(true);
      expect(engine.check("deny_2500").allowed).toBe(false);
    });

    it("should match wildcard patterns efficiently", () => {
      const patterns: string[] = [];
      for (let i = 0; i < 1000; i++) {
        patterns.push(`ns_${i}_*`);
      }
      const engine = new PermissionEngine({
        allowedTools: patterns,
        defaultAction: "deny",
      });
      const result = benchmark(() => {
        engine.check("ns_500_some_action");
      }, 10000);
      expect(result.opsPerSec).toBeGreaterThan(100);
      expect(engine.check("ns_500_some_action").allowed).toBe(true);
      expect(engine.check("ns_5000_missing").allowed).toBe(false);
    });
  });

  describe("5. Fuzzy Edit Matching", () => {
    const sampleFile = [
      "import React from 'react';",
      "",
      "interface Props {",
      "  name: string;",
      "  age: number;",
      "  email?: string;",
      "}",
      "",
      "export function UserCard({ name, age, email }: Props) {",
      "  return (",
      "    <div className='user-card'>",
      "      <h2>{name}</h2>",
      "      <p>Age: {age}</p>",
      "      {email && <p>Email: {email}</p>}",
      "    </div>",
      "  );",
      "}",
      "",
      "export default UserCard;",
    ].join("\n");

    it("should perform exact match replacement", () => {
      const oldStr = "      <h2>{name}</h2>";
      const newStr = "      <h2 className='title'>{name}</h2>";
      const result = benchmark(() => {
        fuzzyReplace(sampleFile, oldStr, newStr);
      }, 10000);
      expect(result.opsPerSec).toBeGreaterThan(1000);
      const replaced = fuzzyReplace(sampleFile, oldStr, newStr);
      expect(replaced).toContain("className='title'");
      expect(replaced).toContain("export default UserCard");
    });

    it("should match with whitespace differences", () => {
      const oldStr = "interface Props {\n  name: string;\n  age: number;\n}";
      const newStr = "interface Props {\n  name: string;\n  age: number;\n  isActive: boolean;\n}";
      const result = benchmark(() => {
        fuzzyReplace(sampleFile, oldStr, newStr);
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(500);
      const replaced = fuzzyReplace(sampleFile, oldStr, newStr);
      expect(replaced).toContain("isActive: boolean");
    });

    it("should match with whitespace normalization", () => {
      const oldStr = "      <h2>{name}</h2>  \n      <p>Age: {age}</p>  ";
      const newStr = "      <h2 className='title'>{name}</h2>\n      <p>Age: {age}</p>";
      const result = benchmark(() => {
        fuzzyReplace(sampleFile, oldStr, newStr);
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(200);
      const replaced = fuzzyReplace(sampleFile, oldStr, newStr);
      expect(replaced).toContain("className='title'");
    });

    it("should match multi-line blocks with fuzzy anchor", () => {
      const oldStr = [
        "export function UserCard({ name, age, email }: Props) {",
        "  return (",
        "    <div className='user-card'>",
        "      <h2>{name}</h2>",
        "    </div>",
        "  );",
        "}",
      ].join("\n");
      const newStr = [
        "export function UserCard({ name, age, email }: Props) {",
        "  return (",
        "    <div className='user-card-modern'>",
        "      <h2 className='heading'>{name}</h2>",
        "    </div>",
        "  );",
        "}",
      ].join("\n");
      const result = benchmark(() => {
        fuzzyReplace(sampleFile, oldStr, newStr);
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(200);
      const replaced = fuzzyReplace(sampleFile, oldStr, newStr);
      expect(replaced).toContain("user-card-modern");
      expect(replaced).toContain("heading");
    });

    it("should report not_found for missing content", () => {
      expect(() => fuzzyReplace(sampleFile, "COMPLETELY NONEXISTENT CONTENT HERE", "x")).toThrow(FuzzyEditError);
    });

    it("should check fuzzyContains accurately", () => {
      const result = benchmark(() => {
        fuzzyContains(sampleFile, "<h2>{name}</h2>");
      }, 10000);
      expect(result.opsPerSec).toBeGreaterThan(1000);
      expect(fuzzyContains(sampleFile, "<h2>{name}</h2>")).toBe(true);
      expect(fuzzyContains(sampleFile, "DOES_NOT_EXIST")).toBe(false);
    });
  });

  describe("6. Context Compaction", () => {
    it("should compact 100 messages via snip", async () => {
      const messages = generateConversation(34);
      expect(messages.length).toBeGreaterThanOrEqual(100);
      const manager = new ContextManager({ maxTokens: 2000, maxOutputTokens: 100, compactThreshold: 0.5 });
      const start = performance.now();
      for (let i = 0; i < 20; i++) {
        await manager.compact([...messages]);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 20;
      expect(avgMs).toBeLessThan(100);
      const result = await manager.compact([...messages]);
      expect(result.tokensSaved).toBeGreaterThan(0);
      expect(result.messages.length).toBeLessThan(messages.length);
    });

    it("should compact 500 messages via snip", async () => {
      const messages = generateConversation(167);
      expect(messages.length).toBeGreaterThanOrEqual(500);
      const manager = new ContextManager({ maxTokens: 5000, maxOutputTokens: 100, compactThreshold: 0.5 });
      const start = performance.now();
      for (let i = 0; i < 5; i++) {
        await manager.compact([...messages]);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 5;
      expect(avgMs).toBeLessThan(500);
      const result = await manager.compact([...messages]);
      expect(result.tokensSaved).toBeGreaterThan(0);
      expect(result.messages.length).toBeLessThan(messages.length);
    });

    it("should compact with summaryFn (compact method)", async () => {
      const messages = generateConversation(50);
      const manager = new ContextManager({ maxTokens: 2000, maxOutputTokens: 50, compactThreshold: 0.5 });
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        await manager.compact([...messages], async (msgs) => `Summary of ${msgs.length} messages.`);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 10;
      expect(avgMs).toBeLessThan(100);
      const result = await manager.compact([...messages], async (msgs) => `Summary of ${msgs.length} messages.`);
      expect(result.method).toBe("compact");
      expect(result.tokensSaved).toBeGreaterThan(0);
    });
  });

  describe("7. Doom Loop Detection", () => {
    it("should confirm clean conversation has no doom loop", () => {
      const messages: Message[] = [];
      for (let i = 0; i < 20; i++) {
        messages.push({
          role: "assistant",
          content: [{ type: "tool_use", id: `t${i}`, name: `tool_${i}`, input: { v: i } }],
        });
      }
      const detectLoop = (msgs: Message[]): boolean => {
        const recentToolCalls: ToolUseBlock[] = [];
        const threshold = 3;
        for (let i = msgs.length - 1; i >= 0; i--) {
          const msg = msgs[i];
          if (msg.role !== "assistant") continue;
          if (typeof msg.content === "string") continue;
          for (const block of msg.content) {
            if (block.type === "tool_use") recentToolCalls.push(block);
          }
          if (recentToolCalls.length >= threshold) break;
        }
        if (recentToolCalls.length < threshold) return false;
        const last = recentToolCalls[0];
        return recentToolCalls.every(
          (tc) => tc.name === last.name && JSON.stringify(tc.input) === JSON.stringify(last.input),
        );
      };
      const result = benchmark(() => detectLoop(messages), 50000);
      expect(result.opsPerSec).toBeGreaterThan(10000);
      expect(detectLoop(messages)).toBe(false);
    });

    it("should detect 3-repeat doom loop quickly", () => {
      const messages: Message[] = [];
      const sameInput = { command: "npm test", retry: true };
      for (let i = 0; i < 3; i++) {
        messages.push({
          role: "assistant",
          content: [{ type: "tool_use", id: `loop_${i}`, name: "bash", input: sameInput }],
        });
      }
      const detectLoop = (msgs: Message[]): boolean => {
        const recentToolCalls: ToolUseBlock[] = [];
        const threshold = 3;
        for (let i = msgs.length - 1; i >= 0; i--) {
          const msg = msgs[i];
          if (msg.role !== "assistant") continue;
          if (typeof msg.content === "string") continue;
          for (const block of msg.content) {
            if (block.type === "tool_use") recentToolCalls.push(block);
          }
          if (recentToolCalls.length >= threshold) break;
        }
        if (recentToolCalls.length < threshold) return false;
        const last = recentToolCalls[0];
        return recentToolCalls.every(
          (tc) => tc.name === last.name && JSON.stringify(tc.input) === JSON.stringify(last.input),
        );
      };
      const result = benchmark(() => detectLoop(messages), 50000);
      expect(result.opsPerSec).toBeGreaterThan(10000);
      expect(detectLoop(messages)).toBe(true);
    });
  });

  describe("8. Message Serialization Roundtrip", () => {
    it("should serialize and parse messages via JSON roundtrip", () => {
      const messages = generateConversation(50);
      const result = benchmark(() => {
        const serialized = JSON.stringify(messages);
        const parsed = JSON.parse(serialized) as Message[];
        return parsed;
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(100);
      const serialized = JSON.stringify(messages);
      const parsed = JSON.parse(serialized) as Message[];
      expect(parsed.length).toBe(messages.length);
      expect(parsed[0].role).toBe("user");
    });

    it("should roundtrip complex messages with all block types", () => {
      const messages: Message[] = [
        { role: "user", content: "Run the tests" },
        {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "I'll run the test suite now." },
            { type: "text", text: "Running tests..." },
            { type: "tool_use", id: "t1", name: "bash", input: { command: "npm test" } },
          ],
        },
        { role: "tool", tool_use_id: "t1", content: "All 42 tests passed.", is_error: false },
      ];
      const result = benchmark(() => {
        const json = JSON.stringify(messages);
        const back = JSON.parse(json) as Message[];
        return back;
      }, 20000);
      expect(result.opsPerSec).toBeGreaterThan(500);
      const json = JSON.stringify(messages);
      const back = JSON.parse(json) as Message[];
      expect(back).toEqual(messages);
    });

    it("should roundtrip through stream aggregator", () => {
      const events = [
        { type: "text_delta" as const, text: "Hello " },
        { type: "text_delta" as const, text: "world" },
        { type: "tool_use_start" as const, id: "t1", name: "bash", input: '{"command":"ls"}' },
        { type: "done" as const, usage: { inputTokens: 100, outputTokens: 50 } },
      ];
      const result = benchmark(() => {
        const agg = createStreamAggregator();
        for (const e of events) agg.push(e);
        agg.getResponse();
      }, 50000);
      expect(result.opsPerSec).toBeGreaterThan(10000);
      const agg = createStreamAggregator();
      for (const e of events) agg.push(e);
      const resp = agg.getResponse();
      expect(resp.text).toBe("Hello world");
      expect(resp.toolCalls).toHaveLength(1);
      expect(resp.toolCalls[0].input).toBe('{"command":"ls"}');
      expect(resp.stopReason).toBe("tool_use");
      expect(resp.usage?.inputTokens).toBe(100);
    });
  });

  describe("9. Circuit Breaker Transitions", () => {
    it("should handle CLOSED -> OPEN transition via recordFailure", () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10000 });
      const result = benchmark(() => {
        const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10000 });
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.checkExecutionState();
      }, 20000);
      expect(result.opsPerSec).toBeGreaterThan(5000);
      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      const state = cb.checkExecutionState();
      expect(state.allowed).toBe(false);
    });

    it("should handle OPEN -> HALF_OPEN -> CLOSED transition", () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 0 });
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.checkExecutionState().allowed).toBe(true);
      cb.recordSuccess();
      const state = cb.checkExecutionState();
      expect(state.allowed).toBe(true);
    });

    it("should execute through circuit breaker", async () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10000 });
      let callCount = 0;
      const result = benchmark(() => {
        const localCb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10000 });
        localCb.execute(async () => {
          callCount++;
          return "ok";
        });
      }, 5000);
      expect(result.opsPerSec).toBeGreaterThan(100);
      await cb.execute(async () => "ok");
      const state = cb.checkExecutionState();
      expect(state.allowed).toBe(true);
    });

    it("should benchmark rapid state transitions", () => {
      const cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 5000 });
      const result = benchmark(() => {
        for (let i = 0; i < 4; i++) cb.recordFailure();
        cb.checkExecutionState();
        cb.recordSuccess();
        cb.checkExecutionState();
      }, 10000);
      expect(result.opsPerSec).toBeGreaterThan(1000);
    });
  });

  describe("10. Tool Orchestration (Serial vs Concurrent)", () => {
    it("should execute 10 read-only tools concurrently", async () => {
      const registry = new ToolRegistry();
      const execTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        registry.add(
          defineTool({
            name: `readonly_${i}`,
            description: `Read-only tool ${i}`,
            inputSchema: z.object({ value: z.string() }),
            isReadOnly: true,
            isConcurrencySafe: true,
            execute: async ({ value }) => {
              await new Promise((r) => setTimeout(r, 10));
              return `result:${value}`;
            },
          }),
        );
      }
      const calls: ToolUseBlock[] = Array.from({ length: 10 }, (_, i) =>
        makeToolUseBlock(`call_${i}`, `readonly_${i}`, { value: `v${i}` }),
      );
      const start = performance.now();
      const results = await orchestrateTools(registry, calls, TOOL_CONTEXT);
      const elapsed = performance.now() - start;
      expect(results).toHaveLength(10);
      expect(elapsed).toBeLessThan(500);
      for (const r of results) {
        expect(r.isError).toBe(false);
        expect(r.output).toContain("result:");
      }
    });

    it("should execute 10 non-safe tools serially", async () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 10; i++) {
        registry.add(
          defineTool({
            name: `write_${i}`,
            description: `Write tool ${i}`,
            inputSchema: z.object({ value: z.string() }),
            isReadOnly: false,
            isConcurrencySafe: false,
            execute: async ({ value }) => `written:${value}`,
          }),
        );
      }
      const calls: ToolUseBlock[] = Array.from({ length: 10 }, (_, i) =>
        makeToolUseBlock(`call_${i}`, `write_${i}`, { value: `v${i}` }),
      );
      const start = performance.now();
      const results = await orchestrateTools(registry, calls, TOOL_CONTEXT);
      const elapsed = performance.now() - start;
      expect(results).toHaveLength(10);
      expect(elapsed).toBeLessThan(1000);
      for (const r of results) {
        expect(r.isError).toBe(false);
      }
    });

    it("should benchmark orchestration throughput for quick tools", async () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 10; i++) {
        registry.add(
          defineTool({
            name: `fast_${i}`,
            description: `Fast tool ${i}`,
            inputSchema: z.object({ value: z.string() }),
            isReadOnly: true,
            isConcurrencySafe: true,
            execute: async ({ value }) => `fast:${value}`,
          }),
        );
      }
      const calls: ToolUseBlock[] = Array.from({ length: 10 }, (_, i) =>
        makeToolUseBlock(`call_${i}`, `fast_${i}`, { value: `v${i}` }),
      );
      const iterations = 50;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await orchestrateTools(registry, calls.map((c) => ({ ...c, id: `${c.id}_${i}` })), TOOL_CONTEXT);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / iterations;
      expect(avgMs).toBeLessThan(100);
    });

    it("should handle permission denied in orchestrated tools", async () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 5; i++) {
        registry.add(makeMockTool(`denied_${i}`));
      }
      const calls: ToolUseBlock[] = Array.from({ length: 5 }, (_, i) =>
        makeToolUseBlock(`call_${i}`, `denied_${i}`, { value: "x" }),
      );
      const results = await orchestrateTools(
        registry,
        calls,
        TOOL_CONTEXT,
        async (name) => !name.startsWith("denied_"),
      );
      expect(results).toHaveLength(5);
      for (const r of results) {
        expect(r.isError).toBe(true);
        expect(r.output).toContain("Permission denied");
      }
    });
  });
});
