import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "../../src/llm/openai.js";
import { RetryableError } from "../../src/llm/provider.js";
import type { ChatMessage, APIToolDefinition } from "../../src/llm/provider.js";

class TestableOpenAIProvider extends OpenAIProvider {
  public testMapMessages(messages: ChatMessage[]) {
    return this.mapMessages(messages);
  }
  public testMapTools(tools?: APIToolDefinition[]) {
    return this.mapTools(tools);
  }
  public testMapUsage(usage: unknown) {
    return this.mapUsage(usage);
  }
  public testMapStopReason(reason: string) {
    return this.mapStopReason(reason);
  }
}

function makeProvider() {
  return new TestableOpenAIProvider({ model: "gpt-4o", apiKey: "test-key" });
}

describe("OpenAIProvider", () => {
  describe("mapMessages", () => {
    it("maps user string messages", () => {
      const p = makeProvider();
      const result = p.testMapMessages([{ role: "user", content: "Hello" }]);
      expect(result).toEqual([{ role: "user", content: "Hello" }]);
    });

    it("maps user content blocks", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        { role: "user", content: [{ type: "text", text: "Hi" }, { type: "text", text: "there" }] },
      ]);
      expect(result).toEqual([{ role: "user", content: "Hi\nthere" }]);
    });

    it("maps assistant string content", () => {
      const p = makeProvider();
      const result = p.testMapMessages([{ role: "assistant", content: "response" }]);
      expect(result).toEqual([{ role: "assistant", content: "response" }]);
    });

    it("maps assistant content blocks with text and tool_use", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        {
          role: "assistant",
          content: [
            { type: "text", text: "Let me help" },
            {
              type: "tool_use",
              id: "call_1",
              name: "read_file",
              input: { path: "/foo" },
            },
          ],
        },
      ]);
      expect(result).toEqual([
        {
          role: "assistant",
          content: "Let me help",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "read_file", arguments: '{"path":"/foo"}' },
            },
          ],
        },
      ]);
    });

    it("maps assistant content blocks with no text to null content", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "call_2",
              name: "bash",
              input: { cmd: "ls" },
            },
          ],
        },
      ]);
      expect(result).toEqual([
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_2",
              type: "function",
              function: { name: "bash", arguments: '{"cmd":"ls"}' },
            },
          ],
        },
      ]);
    });

    it("maps tool result messages", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        { role: "tool", tool_use_id: "call_1", content: "file contents here" },
      ]);
      expect(result).toEqual([
        { role: "tool", tool_call_id: "call_1", content: "file contents here" },
      ]);
    });

    it("maps tool result with content blocks", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        {
          role: "tool",
          tool_use_id: "call_1",
          content: [{ type: "text", text: "line1" }, { type: "text", text: "line2" }],
        },
      ]);
      expect(result).toEqual([{ role: "tool", tool_call_id: "call_1", content: "line1\nline2" }]);
    });

    it("maps tool result with missing tool_use_id to empty string", () => {
      const p = makeProvider();
      const result = p.testMapMessages([{ role: "tool", content: "data" } as ChatMessage]);
      expect(result).toEqual([{ role: "tool", tool_call_id: "", content: "data" }]);
    });
  });

  describe("mapTools", () => {
    it("maps tool definitions to OpenAI format", () => {
      const p = makeProvider();
      const tools: APIToolDefinition[] = [
        {
          name: "read_file",
          description: "Read a file",
          input_schema: { type: "object", properties: { path: { type: "string" } } },
        },
      ];
      const result = p.testMapTools(tools);
      expect(result).toEqual([
        {
          type: "function",
          function: {
            name: "read_file",
            description: "Read a file",
            parameters: { type: "object", properties: { path: { type: "string" } } },
          },
        },
      ]);
    });

    it("returns undefined for empty tools array", () => {
      const p = makeProvider();
      expect(p.testMapTools([])).toBeUndefined();
    });

    it("returns undefined for undefined tools", () => {
      const p = makeProvider();
      expect(p.testMapTools(undefined)).toBeUndefined();
    });
  });

  describe("mapUsage", () => {
    it("maps basic usage", () => {
      const p = makeProvider();
      const result = p.testMapUsage({ prompt_tokens: 100, completion_tokens: 50 });
      expect(result).toEqual({ inputTokens: 100, outputTokens: 50, cacheReadTokens: undefined });
    });

    it("maps usage with cached_tokens", () => {
      const p = makeProvider();
      const result = p.testMapUsage({
        prompt_tokens: 200,
        completion_tokens: 75,
        prompt_tokens_details: { cached_tokens: 80 },
      });
      expect(result).toEqual({
        inputTokens: 200,
        outputTokens: 75,
        cacheReadTokens: 80,
      });
    });
  });

  describe("mapStopReason", () => {
    it("maps 'stop' to 'end_turn'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("stop")).toBe("end_turn");
    });

    it("maps 'tool_calls' to 'tool_use'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("tool_calls")).toBe("tool_use");
    });

    it("maps 'length' to 'max_tokens'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("length")).toBe("max_tokens");
    });

    it("maps unknown reason to 'end_turn'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("unknown_reason")).toBe("end_turn");
    });
  });

  describe("chat", () => {
    it("handles text responses", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          { message: { content: "Hello world", tool_calls: undefined }, finish_reason: "stop" },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = {
            completions: { create: mockCreate },
          };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      const response = await provider.chat({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(response.content).toEqual([{ type: "text", text: "Hello world" }]);
      expect(response.stopReason).toBe("end_turn");
      expect(response.usage.inputTokens).toBe(10);
      expect(response.usage.outputTokens).toBe(5);
    });

    it("handles tool call responses", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_abc",
                  type: "function",
                  function: { name: "read_file", arguments: '{"path":"/tmp/f.txt"}' },
                },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 15 },
      });

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = { completions: { create: mockCreate } };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      const response = await provider.chat({
        messages: [{ role: "user", content: "Read the file" }],
      });

      expect(response.content).toEqual([
        {
          type: "tool_use",
          id: "call_abc",
          name: "read_file",
          input: { path: "/tmp/f.txt" },
        },
      ]);
      expect(response.stopReason).toBe("tool_use");
    });

    it("throws RetryableError on 429", async () => {
      const err = new Error("Rate limited");
      (err as any).status = 429;
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = { completions: { create: mockCreate } };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws RetryableError on network error (ECONNRESET)", async () => {
      const err = new Error("reset");
      (err as any).code = "ECONNRESET";
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = { completions: { create: mockCreate } };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws regular Error on non-retryable API error", async () => {
      const err = new Error("Bad request");
      (err as any).status = 400;
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = { completions: { create: mockCreate } };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow("OpenAI API error: Bad request");
    });

    it("passes systemPrompt, tools, and options correctly", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          { message: { content: "ok", tool_calls: undefined }, finish_reason: "stop" },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 2 },
      });

      vi.doMock("openai", () => ({
        default: class MockOpenAI {
          chat = { completions: { create: mockCreate } };
        },
      }));

      const { OpenAIProvider: MockedProvider } = await import("../../src/llm/openai.js");
      const provider = new MockedProvider({ model: "gpt-4o", apiKey: "key" });
      await provider.chat({
        messages: [{ role: "user", content: "test" }],
        systemPrompt: "You are helpful",
        tools: [
          {
            name: "tool1",
            description: "A tool",
            input_schema: { type: "object", properties: {} },
          },
        ],
        maxOutputTokens: 100,
        temperature: 0.5,
      });

      expect(mockCreate).toHaveBeenCalled();
      const [body] = mockCreate.mock.calls[0];
      expect(body.model).toBe("gpt-4o");
      expect(body.messages[0]).toEqual({ role: "system", content: "You are helpful" });
      expect(body.tools).toBeDefined();
      expect(body.max_tokens).toBe(100);
      expect(body.temperature).toBe(0.5);
    });
  });
});
