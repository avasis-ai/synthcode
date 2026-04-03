import { describe, it, expect } from "vitest";
import { Agent } from "../src/agent.js";
import type { Provider } from "../src/llm/provider.js";
import type { ChatRequest, ModelResponse, LoopEvent } from "../src/types.js";
import { defineTool } from "../src/tools/tool.js";
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

describe("Agent", () => {
  it("constructor sets defaults correctly", () => {
    const agent = new Agent({ model: new MockProvider([]) });
    expect(agent.getMessages()).toEqual([]);
  });

  it("constructor with tools config", () => {
    const tool = defineTool({
      name: "init_tool",
      description: "initial",
      inputSchema: z.object({}),
      execute: async () => "ok",
    });
    const agent = new Agent({ model: new MockProvider([]), tools: [tool] });
    expect(agent.getMessages()).toEqual([]);
  });

  it("chat() returns text from provider", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    const result = await agent.chat("hi");
    expect(result.text).toBe("hello");
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(5);
  });

  it("chat() accumulates messages across calls", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "reply 1" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
      {
        content: [{ type: "text", text: "reply 2" }],
        usage: { inputTokens: 20, outputTokens: 10 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    await agent.chat("first");
    await agent.chat("second");
    const msgs = agent.getMessages();
    expect(msgs).toHaveLength(4);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].role).toBe("assistant");
    expect(msgs[2].role).toBe("user");
    expect(msgs[3].role).toBe("assistant");
  });

  it("chat() returns messages in result", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    const result = await agent.chat("hi");
    expect(result.messages).toHaveLength(2);
  });

  it("chat() with tool use returns accumulated text", async () => {
    const tool = defineTool({
      name: "echo",
      description: "echoes input",
      inputSchema: z.object({ text: z.string() }),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async ({ text }) => `Echo: ${text}`,
    });
    const provider = new MockProvider([
      {
        content: [
          { type: "tool_use", id: "1", name: "echo", input: { text: "hello" } },
        ],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "tool_use",
      },
      {
        content: [{ type: "text", text: "got it" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, tools: [tool], disableTitle: true });
    const result = await agent.chat("test");
    expect(result.text).toBe("got it");
  });

  it("reset() clears messages", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    await agent.chat("hi");
    expect(agent.getMessages().length).toBeGreaterThan(0);
    agent.reset();
    expect(agent.getMessages()).toEqual([]);
  });

  it("getMessages() returns copy", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    await agent.chat("hi");
    const msgs = agent.getMessages();
    const originalLength = msgs.length;
    msgs.push({ role: "user", content: "injected" });
    expect(agent.getMessages()).toHaveLength(originalLength);
  });

  it("addTool() adds to tool registry", async () => {
    const addedTool = defineTool({
      name: "added_tool",
      description: "Dynamically added",
      inputSchema: z.object({ x: z.number() }),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async ({ x }) => `x=${x}`,
    });
    const provider = new MockProvider([
      {
        content: [
          { type: "tool_use", id: "1", name: "added_tool", input: { x: 42 } },
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
    const agent = new Agent({ model: provider, disableTitle: true });
    agent.addTool(addedTool);
    const result = await agent.chat("test");
    expect(result.text).toBe("done");
    const toolMsgs = agent.getMessages().filter((m) => m.role === "tool");
    expect(toolMsgs).toHaveLength(1);
  });

  it("run() yields events as async generator", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    const events: LoopEvent[] = [];
    for await (const event of agent.run("hi")) {
      events.push(event);
    }
    const textEvents = events.filter((e) => e.type === "text");
    const doneEvents = events.filter((e) => e.type === "done");
    expect(textEvents).toHaveLength(1);
    expect(doneEvents).toHaveLength(1);
  });

  it("run() updates internal messages after completion", async () => {
    const provider = new MockProvider([
      {
        content: [{ type: "text", text: "hello" }],
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end_turn",
      },
    ]);
    const agent = new Agent({ model: provider, disableTitle: true });
    for await (const _event of agent.run("hi")) {
    }
    expect(agent.getMessages().length).toBe(2);
  });

  it("constructor accepts systemPrompt", () => {
    const agent = new Agent({
      model: new MockProvider([]),
      systemPrompt: "You are helpful.",
    });
    expect(agent.getMessages()).toEqual([]);
  });

  it("constructor accepts maxTurns", async () => {
    const responses: ModelResponse[] = Array.from({ length: 10 }, (_, i) => ({
      content: [
        { type: "tool_use", id: `t${i}`, name: "mock_tool", input: { value: "x" } },
      ],
      usage: { inputTokens: 10, outputTokens: 5 },
      stopReason: "tool_use" as const,
    }));
    const tool = defineTool({
      name: "mock_tool",
      description: "test",
      inputSchema: z.object({ value: z.string() }),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async () => "ok",
    });
    const provider = new MockProvider(responses);
    const agent = new Agent({ model: provider, maxTurns: 1, tools: [tool], disableTitle: true });
    const events: LoopEvent[] = [];
    for await (const event of agent.run("go")) {
      events.push(event);
    }
    const errorEvents = events.filter((e) => e.type === "error");
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);
    expect(errorEvents[errorEvents.length - 1].error.message).toContain("Max turns");
  });
});
