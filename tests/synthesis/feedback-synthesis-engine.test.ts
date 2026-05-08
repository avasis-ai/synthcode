import { describe, it, expect } from "vitest";
import { FeedbackSynthesisEngine } from "../src/synthesis/feedback-synthesis-engine";

describe("FeedbackSynthesisEngine", () => {
  it("should synthesize a summary when provided with multiple message types", async () => {
    const engine = new FeedbackSynthesisEngine();
    const messages = [
      { role: "user", content: "I need help with my project." },
      { role: "assistant", content: [{ type: "text", content: "Sure, how can I help?" }] },
      { role: "tool", tool_use_id: "tool1", content: "Tool executed successfully.", is_error: false },
      { role: "user", content: "Thanks, that was very helpful." },
    ];
    const summary = await engine.synthesize(messages);
    expect(summary).toContain("summary");
    expect(summary).toContain("help");
    expect(summary).toContain("helpful");
  });

  it("should handle an empty message history gracefully", async () => {
    const engine = new FeedbackSynthesisEngine();
    const messages: any[] = [];
    const summary = await engine.synthesize(messages);
    expect(summary).toBe("");
  });

  it("should prioritize recent user feedback when synthesizing", async () => {
    const engine = new FeedbackSynthesisEngine();
    const messages = [
      { role: "user", content: "Initial query." },
      { role: "assistant", content: [{ type: "text", content: "Initial response." }] },
      { role: "user", content: "The latest feature is confusing." },
    ];
    const summary = await engine.synthesize(messages);
    expect(summary).toContain("confusing");
    expect(summary).not.toContain("Initial query");
  });
});