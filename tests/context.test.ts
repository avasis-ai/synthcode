import { describe, it, expect } from "vitest";
import { estimateTokens, estimateMessageTokens, estimateConversationTokens } from "../src/context/tokenizer.js";
import { ContextManager } from "../src/context/manager.js";
import type { Message } from "../src/types.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("returns positive number for short text", () => {
    expect(estimateTokens("hello")).toBeGreaterThan(0);
  });

  it("returns positive number for long text", () => {
    expect(estimateTokens("a".repeat(1000))).toBeGreaterThan(0);
  });

  it("returns positive number for code", () => {
    expect(estimateTokens("function foo() { return 42; }")).toBeGreaterThan(0);
  });

  it("returns positive number for unicode", () => {
    expect(estimateTokens("cafe resume naive")).toBeGreaterThan(0);
  });
});

describe("estimateMessageTokens", () => {
  it("handles UserMessage", () => {
    const msg: Message = { role: "user", content: "hello world" };
    expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
  });

  it("handles AssistantMessage with text block", () => {
    const msg: Message = {
      role: "assistant",
      content: [{ type: "text", text: "hello" }],
    };
    expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
  });

  it("handles AssistantMessage with tool_use block", () => {
    const msg: Message = {
      role: "assistant",
      content: [{ type: "tool_use", id: "1", name: "bash", input: { cmd: "ls" } }],
    };
    expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
  });

  it("handles AssistantMessage with thinking block", () => {
    const msg: Message = {
      role: "assistant",
      content: [{ type: "thinking", thinking: "let me think" }],
    };
    expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
  });

  it("handles ToolResultMessage", () => {
    const msg: Message = {
      role: "tool",
      tool_use_id: "1",
      content: "result data",
    };
    expect(estimateMessageTokens(msg)).toBeGreaterThan(0);
  });
});

describe("estimateConversationTokens", () => {
  it("returns correct total and byRole breakdown", () => {
    const messages: Message[] = [
      { role: "user", content: "hello" },
      {
        role: "assistant",
        content: [{ type: "text", text: "hi" }],
      },
    ];
    const result = estimateConversationTokens(messages);
    expect(result.total).toBeGreaterThan(0);
    expect(result.byRole.user).toBeGreaterThan(0);
    expect(result.byRole.assistant).toBeGreaterThan(0);
  });

  it("returns zero for empty messages", () => {
    const result = estimateConversationTokens([]);
    expect(result.total).toBe(0);
    expect(result.byRole).toEqual({});
  });

  it("handles mixed message roles", () => {
    const messages: Message[] = [
      { role: "user", content: "do something" },
      {
        role: "assistant",
        content: [{ type: "tool_use", id: "1", name: "bash", input: { cmd: "ls" } }],
      },
      {
        role: "tool",
        tool_use_id: "1",
        content: "file1.txt\nfile2.txt",
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "here are the files" }],
      },
    ];
    const result = estimateConversationTokens(messages);
    expect(result.total).toBeGreaterThan(0);
    expect(result.byRole.user).toBeGreaterThan(0);
    expect(result.byRole.assistant).toBeGreaterThan(0);
    expect(result.byRole.tool).toBeGreaterThan(0);
  });
});

describe("ContextManager", () => {
  it("check() returns correct usage info for empty messages", () => {
    const manager = new ContextManager({ maxTokens: 1000, maxOutputTokens: 100 });
    const check = manager.check([]);
    expect(check.totalTokens).toBe(0);
    expect(check.availableTokens).toBe(900);
    expect(check.usagePercent).toBe(0);
    expect(check.needsCompact).toBe(false);
    expect(check.recommendedMethod).toBe("snip");
  });

  it("check() returns needsCompact=true when over threshold", () => {
    const manager = new ContextManager({ maxTokens: 100, maxOutputTokens: 10, compactThreshold: 0.5 });
    const messages: Message[] = Array.from({ length: 10 }, () => ({
      role: "user" as const,
      content: "a".repeat(100),
    }));
    const check = manager.check(messages);
    expect(check.needsCompact).toBe(true);
  });

  it("check().recommendedMethod is 'compact' at >95%", () => {
    const manager = new ContextManager({ maxTokens: 100, maxOutputTokens: 10 });
    const messages: Message[] = Array.from({ length: 20 }, () => ({
      role: "user" as const,
      content: "a".repeat(50),
    }));
    const check = manager.check(messages);
    expect(check.usagePercent).toBeGreaterThan(0.95);
    expect(check.recommendedMethod).toBe("compact");
  });

  it("check().recommendedMethod is 'snip' when between threshold and 95%", () => {
    const manager = new ContextManager({ maxTokens: 600, maxOutputTokens: 10, compactThreshold: 0.85 });
    const messages: Message[] = Array.from({ length: 29 }, () => ({
      role: "user" as const,
      content: "a".repeat(15),
    }));
    const check = manager.check(messages);
    expect(check.usagePercent).toBeGreaterThanOrEqual(0.85);
    expect(check.usagePercent).toBeLessThanOrEqual(0.95);
    expect(check.recommendedMethod).toBe("snip");
  });

  it("compact() with no compaction needed returns original messages", async () => {
    const manager = new ContextManager({ maxTokens: 100000, maxOutputTokens: 1000 });
    const messages: Message[] = [{ role: "user", content: "hello" }];
    const result = await manager.compact(messages);
    expect(result.method).toBe("none");
    expect(result.tokensSaved).toBe(0);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual(messages[0]);
  });

  it("compact() with snip method removes middle messages", async () => {
    const manager = new ContextManager({ maxTokens: 600, maxOutputTokens: 10, compactThreshold: 0.85 });
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}: ${"a".repeat(15)}`,
    }));
    const result = await manager.compact(messages);
    expect(result.method).toBe("snip");
    expect(result.tokensSaved).toBeGreaterThan(0);
    expect(result.messages.length).toBeLessThan(30);
    expect(result.messages[0]).toEqual(messages[0]);
  });

  it("compact() with summaryFn and compact method summarizes", async () => {
    const manager = new ContextManager({ maxTokens: 550, maxOutputTokens: 10, compactThreshold: 0.85 });
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}: ${"a".repeat(20)}`,
    }));
    const result = await manager.compact(messages, async (msgs) => {
      return `Summary of ${msgs.length} messages`;
    });
    expect(result.method).toBe("compact");
    expect(result.tokensSaved).toBeGreaterThan(0);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toContain("Summary");
    expect(result.messages.length).toBeLessThan(30);
  });

  it("compact() without summaryFn uses snip even when recommendedMethod is compact", async () => {
    const manager = new ContextManager({ maxTokens: 550, maxOutputTokens: 10, compactThreshold: 0.85 });
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}: ${"a".repeat(20)}`,
    }));
    const result = await manager.compact(messages);
    expect(result.method).toBe("snip");
    expect(result.tokensSaved).toBeGreaterThan(0);
  });

  it("getAvailableTokens() returns positive number", () => {
    const manager = new ContextManager({ maxTokens: 100000, maxOutputTokens: 1000 });
    expect(manager.getAvailableTokens([])).toBeGreaterThan(0);
  });

  it("getUsagePercent() returns 0 for empty messages", () => {
    const manager = new ContextManager({ maxTokens: 100000, maxOutputTokens: 1000 });
    expect(manager.getUsagePercent([])).toBe(0);
  });
});
