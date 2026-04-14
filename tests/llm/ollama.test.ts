import { describe, it, expect, vi, beforeEach } from "vitest";
import { OllamaProvider } from "../../src/llm/ollama.js";
import { RetryableError } from "../../src/llm/provider.js";

function makeProvider(baseURL?: string) {
  return new OllamaProvider({ model: "llama3", baseURL });
}

function ollamaResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: { content: "ok", tool_calls: undefined },
          finish_reason: "stop",
          ...overrides,
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("OllamaProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the model name", () => {
    const p = makeProvider();
    expect(p.model).toBe("llama3");
  });

  describe("chat", () => {
    it("handles basic text responses", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(ollamaResponse());

      const response = await p.chat({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(response.content).toEqual([{ type: "text", text: "ok" }]);
      expect(response.stopReason).toBe("end_turn");
      expect(response.usage.inputTokens).toBe(10);
      expect(response.usage.outputTokens).toBe(5);
    });

    it("handles tool calls in responses", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "Let me check",
                  tool_calls: [
                    {
                      id: "call_1",
                      type: "function",
                      function: { name: "bash", arguments: '{"cmd":"ls"}' },
                    },
                  ],
                },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 15, completion_tokens: 10 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await p.chat({
        messages: [{ role: "user", content: "List files" }],
      });

      expect(response.stopReason).toBe("tool_use");
      expect(response.content).toContainEqual({
        type: "tool_use",
        id: "call_1",
        name: "bash",
        input: { cmd: "ls" },
      });
    });

    it("includes system prompt in messages", async () => {
      const p = makeProvider();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ollamaResponse());

      await p.chat({
        messages: [{ role: "user", content: "hi" }],
        systemPrompt: "Be helpful",
      });

      const body = JSON.parse((fetchSpy.mock.calls[0]![1] as any).body);
      expect(body.messages[0]).toEqual({ role: "system", content: "Be helpful" });
    });

    it("maps assistant messages with tool use content blocks", async () => {
      const p = makeProvider();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ollamaResponse());

      await p.chat({
        messages: [
          {
            role: "assistant",
            content: [
              { type: "text", text: "Running" },
              { type: "tool_use", id: "tc_1", name: "bash", input: { cmd: "pwd" } },
            ],
          },
        ],
      });

      const body = JSON.parse((fetchSpy.mock.calls[0]![1] as any).body);
      expect(body.messages[0]).toEqual({
        role: "assistant",
        content: "Running",
        tool_calls: [
          {
            id: "tc_1",
            type: "function",
            function: { name: "bash", arguments: '{"cmd":"pwd"}' },
          },
        ],
      });
    });

    it("maps tool result messages", async () => {
      const p = makeProvider();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ollamaResponse());

      await p.chat({
        messages: [{ role: "tool", tool_use_id: "tc_1", content: "/home/user" }],
      });

      const body = JSON.parse((fetchSpy.mock.calls[0]![1] as any).body);
      expect(body.messages[0]).toEqual({
        role: "tool",
        tool_call_id: "tc_1",
        content: "/home/user",
      });
    });

    it("sends tools in OpenAI-compatible format when provided", async () => {
      const p = makeProvider();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ollamaResponse());

      await p.chat({
        messages: [{ role: "user", content: "hi" }],
        tools: [
          {
            name: "bash",
            description: "Run command",
            input_schema: { type: "object", properties: { cmd: { type: "string" } } },
          },
        ],
      });

      const body = JSON.parse((fetchSpy.mock.calls[0]![1] as any).body);
      expect(body.tools).toEqual([
        {
          type: "function",
          function: {
            name: "bash",
            description: "Run command",
            parameters: { type: "object", properties: { cmd: { type: "string" } } },
          },
        },
      ]);
    });

    it("strips <think...>...</think*> tags from content", async () => {
      const p = makeProvider();
      const thinkContent = "Before" + "<think hmm>secret</think" + ">After";
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: thinkContent, tool_calls: undefined }, finish_reason: "stop" }],
            usage: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await p.chat({ messages: [{ role: "user", content: "hi" }] });
      expect(response.content).toEqual([{ type: "text", text: "BeforeAfter" }]);
    });

    it("strips <thinking>...</thinking> tags from content", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: "<thinking>internal</thinking>The answer", tool_calls: undefined },
                finish_reason: "stop",
              },
            ],
            usage: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await p.chat({ messages: [{ role: "user", content: "hi" }] });
      expect(response.content).toEqual([{ type: "text", text: "The answer" }]);
    });

    it("strips [Thinking...] bracket patterns", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: "[Thinking about it]Real answer", tool_calls: undefined },
                finish_reason: "stop",
              },
            ],
            usage: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await p.chat({ messages: [{ role: "user", content: "hi" }] });
      expect(response.content).toEqual([{ type: "text", text: "Real answer" }]);
    });

    it("throws RetryableError on connection failure", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

      await expect(
        p.chat({ messages: [{ role: "user", content: "hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws RetryableError on 429", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("rate limited", { status: 429 }));

      await expect(
        p.chat({ messages: [{ role: "user", content: "hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws RetryableError on 503", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("unavailable", { status: 503 }));

      await expect(
        p.chat({ messages: [{ role: "user", content: "hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws regular Error on other HTTP errors", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("bad request", { status: 400 }));

      await expect(
        p.chat({ messages: [{ role: "user", content: "hi" }] }),
      ).rejects.toThrow("Ollama API error 400");
    });

    it("throws when no choices returned", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ choices: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(
        p.chat({ messages: [{ role: "user", content: "hi" }] }),
      ).rejects.toThrow("Ollama returned no choices");
    });

    it("defaults usage to 0 when missing from response", async () => {
      const p = makeProvider();
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const response = await p.chat({ messages: [{ role: "user", content: "hi" }] });
      expect(response.usage.inputTokens).toBe(0);
      expect(response.usage.outputTokens).toBe(0);
    });
  });
});
