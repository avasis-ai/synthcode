import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "../../src/llm/anthropic.js";
import { RetryableError } from "../../src/llm/provider.js";
import type { ChatMessage, APIToolDefinition } from "../../src/llm/provider.js";

class TestableAnthropicProvider extends AnthropicProvider {
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
  return new TestableAnthropicProvider({ model: "claude-sonnet-4-20250514", apiKey: "test-key" });
}

describe("AnthropicProvider", () => {
  describe("mapMessages", () => {
    it("maps user string messages", () => {
      const p = makeProvider();
      const result = p.testMapMessages([{ role: "user", content: "Hello" }]);
      expect(result).toEqual([{ role: "user", content: "Hello" }]);
    });

    it("maps user content blocks", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        { role: "user", content: [{ type: "text", text: "Hi" }] },
      ]);
      expect(result).toEqual([{ role: "user", content: [{ type: "text", text: "Hi" }] }]);
    });

    it("maps assistant string content", () => {
      const p = makeProvider();
      const result = p.testMapMessages([{ role: "assistant", content: "response" }]);
      expect(result).toEqual([{ role: "assistant", content: [{ type: "text", text: "response" }] }]);
    });

    it("maps assistant content blocks", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        {
          role: "assistant",
          content: [
            { type: "text", text: "Thinking..." },
            { type: "tool_use", id: "tu_1", name: "bash", input: { cmd: "ls" } },
          ],
        },
      ]);
      expect(result).toEqual([
        {
          role: "assistant",
          content: [
            { type: "text", text: "Thinking..." },
            { type: "tool_use", id: "tu_1", name: "bash", input: { cmd: "ls" } },
          ],
        },
      ]);
    });

    it("maps tool result messages to user role with tool_result", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        { role: "tool", tool_use_id: "tu_1", content: "output data" },
      ]);
      expect(result).toEqual([
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: "tu_1", content: "output data" }],
        },
      ]);
    });

    it("maps tool result with is_error flag", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        { role: "tool", tool_use_id: "tu_2", content: "failed", is_error: true },
      ]);
      expect(result).toEqual([
        {
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: "tu_2", content: "failed", is_error: true },
          ],
        },
      ]);
    });

    it("maps tool result with content blocks", () => {
      const p = makeProvider();
      const result = p.testMapMessages([
        {
          role: "tool",
          tool_use_id: "tu_3",
          content: [{ type: "text", text: "line1" }, { type: "text", text: "line2" }],
        },
      ]);
      expect(result).toEqual([
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: "tu_3", content: "line1\nline2" }],
        },
      ]);
    });
  });

  describe("mapTools", () => {
    it("maps tool definitions to Anthropic format", () => {
      const p = makeProvider();
      const tools: APIToolDefinition[] = [
        {
          name: "bash",
          description: "Run a command",
          input_schema: { type: "object", properties: { cmd: { type: "string" } } },
        },
      ];
      const result = p.testMapTools(tools);
      expect(result).toEqual([
        {
          name: "bash",
          description: "Run a command",
          input_schema: { type: "object", properties: { cmd: { type: "string" } } },
          type: "tool",
        },
      ]);
    });

    it("returns undefined for empty tools", () => {
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
      const result = p.testMapUsage({ input_tokens: 150, output_tokens: 60 });
      expect(result).toEqual({
        inputTokens: 150,
        outputTokens: 60,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      });
    });

    it("maps usage with cache tokens", () => {
      const p = makeProvider();
      const result = p.testMapUsage({
        input_tokens: 200,
        output_tokens: 80,
        cache_read_input_tokens: 50,
        cache_creation_input_tokens: 30,
      });
      expect(result).toEqual({
        inputTokens: 200,
        outputTokens: 80,
        cacheReadTokens: 50,
        cacheWriteTokens: 30,
      });
    });
  });

  describe("mapStopReason", () => {
    it("maps 'end_turn' to 'end_turn'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("end_turn")).toBe("end_turn");
    });

    it("maps 'tool_use' to 'tool_use'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("tool_use")).toBe("tool_use");
    });

    it("maps 'max_tokens' to 'max_tokens'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("max_tokens")).toBe("max_tokens");
    });

    it("maps 'stop_sequence' to 'stop_sequence'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("stop_sequence")).toBe("stop_sequence");
    });

    it("maps unknown reason to 'end_turn'", () => {
      const p = makeProvider();
      expect(p.testMapStopReason("something_else")).toBe("end_turn");
    });
  });

  describe("chat", () => {
    it("handles text responses", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Hello from Claude" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 25, output_tokens: 10 },
      });

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      const response = await provider.chat({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(response.content).toEqual([{ type: "text", text: "Hello from Claude" }]);
      expect(response.stopReason).toBe("end_turn");
      expect(response.usage.inputTokens).toBe(25);
    });

    it("handles tool use responses", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          { type: "text", text: "Let me check" },
          { type: "tool_use", id: "tu_1", name: "bash", input: { cmd: "pwd" } },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 30, output_tokens: 20 },
      });

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      const response = await provider.chat({
        messages: [{ role: "user", content: "Where am I?" }],
      });

      expect(response.content).toEqual([
        { type: "text", text: "Let me check" },
        { type: "tool_use", id: "tu_1", name: "bash", input: { cmd: "pwd" } },
      ]);
      expect(response.stopReason).toBe("tool_use");
    });

    it("handles thinking blocks", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [
          { type: "thinking", thinking: "Let me reason about this..." },
          { type: "text", text: "Answer" },
        ],
        stop_reason: "end_turn",
        usage: { input_tokens: 50, output_tokens: 30 },
      });

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      const response = await provider.chat({
        messages: [{ role: "user", content: "Think" }],
      });

      expect(response.content).toEqual([
        { type: "thinking", thinking: "Let me reason about this..." },
        { type: "text", text: "Answer" },
      ]);
    });

    it("throws RetryableError on 429", async () => {
      const err = new Error("Rate limited");
      (err as any).status = 429;
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws RetryableError on 529 (overloaded)", async () => {
      const err = new Error("Overloaded");
      (err as any).status = 529;
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow(RetryableError);
    });

    it("throws regular Error on non-retryable error", async () => {
      const err = new Error("Bad request");
      (err as any).status = 400;
      const mockCreate = vi.fn().mockRejectedValue(err);

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: mockCreate };
        },
      }));

      const { AnthropicProvider: MockedProvider } = await import("../../src/llm/anthropic.js");
      const provider = new MockedProvider({
        model: "claude-sonnet-4-20250514",
        apiKey: "key",
      });
      await expect(
        provider.chat({ messages: [{ role: "user", content: "Hi" }] }),
      ).rejects.toThrow("Anthropic API error: Bad request");
    });
  });
});
