import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV136AdvancedAdvanced } from "../context/contextual-state-diffing-v136-advanced-advanced";

describe("ContextualStateDiffingV136AdvancedAdvanced", () => {
  it("should correctly diff a simple sequence of user and assistant messages", () => {
    const context = {
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
      ],
    };
    const nextContext = {
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
        { role: "user", content: "How are you?" },
      ],
    };
    const diff = ContextualStateDiffingV136AdvancedAdvanced.diff(context, nextContext);
    expect(diff).toEqual({
      messages: [
        { role: "user", content: "How are you?" },
      ],
    });
  });

  it("should handle updates where only the last message changes", () => {
    const context = {
      messages: [
        { role: "user", content: "Initial message" },
        { role: "assistant", content: [{ type: "text", text: "Initial response" }] },
      ],
    };
    const nextContext = {
      messages: [
        { role: "user", content: "Initial message" },
        { role: "assistant", content: [{ type: "text", text: "Updated response" }] },
      ],
    };
    const diff = ContextualStateDiffingV136AdvancedAdvanced.diff(context, nextContext);
    expect(diff).toEqual({
      messages: [
        { role: "assistant", content: [{ type: "text", text: "Updated response" }] },
      ],
    });
  });

  it("should return an empty diff if the context remains unchanged", () => {
    const context = {
      messages: [
        { role: "user", content: "Test" },
        { role: "assistant", content: [{ type: "text", text: "Response" }] },
      ],
    };
    const nextContext = {
      messages: [
        { role: "user", content: "Test" },
        { role: "assistant", content: [{ type: "text", text: "Response" }] },
      ],
    };
    const diff = ContextualStateDiffingV136AdvancedAdvanced.diff(context, nextContext);
    expect(diff).toEqual({});
  });
});