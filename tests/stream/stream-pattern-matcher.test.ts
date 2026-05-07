import { describe, it, expect } from "vitest";
import { StreamPatternMatcher, Pattern, Message } from "../src/stream/stream-pattern-matcher.js";

describe("StreamPatternMatcher", () => {
  it("should correctly match a simple sequence of messages", () => {
    const pattern: Pattern = {
      steps: [
        { type: "message_type", messageType: (msg) => msg.type === "login" },
        { type: "message_type", messageType: (msg) => msg.type === "view_page" },
        { type: "message_type", messageType: (msg) => msg.type === "purchase" },
      ],
    };

    const matcher = new StreamPatternMatcher();
    const handler = vi.fn();

    matcher.addPattern("login_view_purchase", pattern, handler);

    const messages: Message[] = [
      { type: "login", timestamp: 100 },
      { type: "view_page", timestamp: 200 },
      { type: "purchase", timestamp: 300 },
    ];

    messages.forEach((msg) => matcher.processMessage(msg));

    expect(handler).toHaveBeenCalledTimes(1);
    const callArgs = handler.mock.calls[0][0] as Message[];
    expect(callArgs).toHaveLength(3);
    expect(callArgs.map(m => m.type)).toEqual(["login", "view_page", "purchase"]);
  });

  it("should handle windowing and reset state when time elapsed", () => {
    const pattern: Pattern = {
      steps: [
        { type: "message_type", messageType: (msg) => msg.type === "login" },
        { type: "window", durationMs: 500 },
        { type: "message_type", messageType: (msg) => msg.type === "view_page" },
        { type: "sequence_end" },
      ],
    };

    const matcher = new StreamPatternMatcher();
    const handler = vi.fn();

    matcher.addPattern("login_window_view", pattern, handler);

    // 1. Login (Start)
    matcher.processMessage({ type: "login", timestamp: 100 });
    expect(handler).not.toHaveBeenCalled();

    // 2. View Page (Within window)
    matcher.processMessage({ type: "view_page", timestamp: 400 });
    expect(handler).toHaveBeenCalledTimes(1);

    // 3. Wait too long (Reset)
    matcher.processMessage({ type: "login", timestamp: 1000 }); // New login starts a new sequence
    matcher.processMessage({ type: "view_page", timestamp: 1600 }); // Too late for the first sequence
    expect(handler).toHaveBeenCalledTimes(1); // Should still only have 1 call
  });

  it("should not match if the sequence is interrupted by an irrelevant message", () => {
    const pattern: Pattern = {
      steps: [
        { type: "message_type", messageType: (msg) => msg.type === "login" },
        { type: "message_type", messageType: (msg) => msg.type === "view_page" },
      ],
    };

    const matcher = new StreamPatternMatcher();
    const handler = vi.fn();

    matcher.addPattern("login_view", pattern, handler);

    // 1. Login
    matcher.processMessage({ type: "login", timestamp: 100 });
    expect(handler).not.toHaveBeenCalled();

    // 2. Irrelevant message
    matcher.processMessage({ type: "logout", timestamp: 200 });
    expect(handler).not.toHaveBeenCalled();

    // 3. View Page (Should fail because the sequence was broken)
    matcher.processMessage({ type: "view_page", timestamp: 300 });
    expect(handler).not.toHaveBeenCalled();
  });
});