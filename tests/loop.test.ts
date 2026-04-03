import { describe, it, expect, vi } from "vitest";
import { agentLoop } from "../src/loop.js";
import { defineTool } from "../src/tools/tool.js";
import { ToolRegistry } from "../src/tools/registry.js";
import { ContextManager } from "../src/context/manager.js";
import { PermissionEngine } from "../src/permissions/engine.js";
import type { Provider } from "../src/llm/provider.js";
import type { ChatRequest, ModelResponse, LoopEvent, Message } from "../src/types.js";
import { z } from "zod";

class MockProvider implements Provider {
  readonly model: string;
  private responses: ModelResponse[];

  constructor(responses: ModelResponse[]) {
    this.model = "mock";
    this.responses = [...responses];
  }

  async chat(_request: ChatRequest): Promise<ModelResponse> {
    const resp = this.responses.shift();
    if (!resp) {
      return {
        content: [{ type: "text", text: "done" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      };
    }
    return resp;
  }
}

const mockTool = defineTool({
  name: "mock_tool",
  description: "A mock tool",
  inputSchema: z.object({
    value: z.string(),
    count: z.number().optional(),
  }),
  isReadOnly: true,
  isConcurrencySafe: true,
  execute: async ({ value, count = 1 }) => `Result: ${value} x${count}`,
});

function createLoopConfig(overrides: Partial<{
  model: Provider;
  tools: ToolRegistry;
  messages: Message[];
  maxTurns: number;
  abortSignal: AbortSignal;
}> = {}) {
  return {
    model: overrides.model ?? new MockProvider([]),
    tools: overrides.tools ?? new ToolRegistry([mockTool]),
    messages: overrides.messages ?? [],
    maxTurns: overrides.maxTurns,
    contextManager: new ContextManager(),
    permissionEngine: new PermissionEngine(),
    ...overrides,
  };
}

async function collectEvents(gen: AsyncGenerator<LoopEvent>): Promise<LoopEvent[]> {
  const events: LoopEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
}

describe("agentLoop", () => {
  it("yields text events from the provider", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello world" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const events = await collectEvents(agentLoop(createLoopConfig({ model: provider })));
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    expect(textEvents[0]).toEqual({ type: "text", text: "hello world" });
  });

  it("yields tool_use events and tool_result events", async () => {
    const provider = new MockProvider([
      {
        content: [
          { type: "tool_use", id: "1", name: "mock_tool", input: { value: "test" } },
        ],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "tool_use",
      },
      {
        content: [{ type: "text", text: "done" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const events = await collectEvents(agentLoop(createLoopConfig({ model: provider })));
    const toolUseEvents = events.filter((e) => e.type === "tool_use");
    const toolResultEvents = events.filter((e) => e.type === "tool_result");
    expect(toolUseEvents).toHaveLength(1);
    expect(toolResultEvents).toHaveLength(1);
    if (toolResultEvents[0].type === "tool_result") {
      expect(toolResultEvents[0].output).toBe("Result: test x1");
      expect(toolResultEvents[0].isError).toBe(false);
    }
  });

  it("stops when provider returns stopReason 'end_turn'", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "final" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const events = await collectEvents(agentLoop(createLoopConfig({ model: provider })));
    const doneEvents = events.filter((e) => e.type === "done");
    expect(doneEvents).toHaveLength(1);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
  });

  it("yields done event with usage and messages", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hi" }],
        usage: { inputTokens: 42, outputTokens: 7 },
        stopReason: "end_turn",
      },
    ]);
    const events = await collectEvents(agentLoop(createLoopConfig({ model: provider })));
    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    if (doneEvent && doneEvent.type === "done") {
      expect(doneEvent.usage.inputTokens).toBe(42);
      expect(doneEvent.usage.outputTokens).toBe(7);
      expect(doneEvent.messages.length).toBeGreaterThan(0);
    }
  });

  it("stops after max turns", async () => {
    const responses: ModelResponse[] = Array.from({ length: 10 }, (_, i) => ({
      content: [
        { type: "tool_use", id: `t${i}`, name: "mock_tool", input: { value: "x" } },
      ],
      usage: { inputTokens: 10, outputTokens: 5 },
      stopReason: "tool_use" as const,
    }));
    const provider = new MockProvider(responses);
    const events = await collectEvents(
      agentLoop(createLoopConfig({ model: provider, maxTurns: 2 }))
    );
    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);
    const lastError = errorEvents[errorEvents.length - 1];
    expect(lastError.type).toBe("error");
    expect(lastError.error.message).toContain("Max turns");
    expect(lastError.error.message).toContain("2");
  });

  it("handles abort signal", async () => {
    const ac = new AbortController();
    ac.abort();
    const events = await collectEvents(
      agentLoop(createLoopConfig({ abortSignal: ac.signal }))
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("error");
    if (events[0].type === "error") {
      expect(events[0].error.message).toBe("Aborted");
    }
  });

  it("handles provider errors (non-retryable)", async () => {
    class ErrorProvider implements Provider {
      readonly model = "error";
      async chat(): Promise<ModelResponse> {
        throw new Error("Something went wrong");
      }
    }
    const events = await collectEvents(
      agentLoop(createLoopConfig({ model: new ErrorProvider() }))
    );
    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0].error.message).toBe("Something went wrong");
  });

  it("handles retryable errors (429) with retry", async () => {
    let callCount = 0;
    class RetryProvider implements Provider {
      readonly model = "retry";
      async chat(): Promise<ModelResponse> {
        callCount++;
        if (callCount === 1) {
          throw new Error("429 Rate limited");
        }
        return {
          content: [{ type: "text", text: "recovered" }],
          usage: { inputTokens: 10, outputTokens: 5 },
          stopReason: "end_turn",
        };
      }
    }
    const events = await collectEvents(
      agentLoop(createLoopConfig({ model: new RetryProvider() }))
    );
    const thinkingEvents = events.filter((e) => e.type === "thinking");
    expect(thinkingEvents.some((e) => e.type === "thinking" && e.thinking.includes("Rate limited"))).toBe(true);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    if (textEvents[0].type === "text") {
      expect(textEvents[0].text).toBe("recovered");
    }
    const doneEvents = events.filter((e) => e.type === "done");
    expect(doneEvents).toHaveLength(1);
    expect(callCount).toBe(2);
  }, 10000);

  it("accumulates messages across tool turns", async () => {
    const provider = new MockProvider([
      {
        content: [
          { type: "tool_use", id: "1", name: "mock_tool", input: { value: "a" } },
        ],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "tool_use",
      },
      {
        content: [{ type: "text", text: "finished" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const messages: Message[] = [{ role: "user", content: "start" }];
    await collectEvents(agentLoop(createLoopConfig({ model: provider, messages })));
    expect(messages.length).toBeGreaterThan(2);
  });

  it("handles thinking blocks from provider", async () => {
    const provider = new MockProvider([
      {
        content: [
          { type: "thinking", thinking: "let me consider" },
          { type: "text", text: "answer" },
        ],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const events = await collectEvents(agentLoop(createLoopConfig({ model: provider })));
    const thinkingEvents = events.filter((e) => e.type === "thinking");
    expect(thinkingEvents.length).toBeGreaterThanOrEqual(1);
  });
});
