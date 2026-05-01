import { describe, it, expect, vi } from "vitest";
import { ContextualHistorySummarizerWithIntentFocus } from "../src/context/contextual-history-summarizer-with-intent-focus";

describe("ContextualHistorySummarizerWithIntentFocus", () => {
  it("should summarize history correctly when no focus intent is provided", async () => {
    const summarizer = new ContextualHistorySummarizerWithIntentFocus("test-model");
    const history: any[] = [
      { role: "user", content: [{ type: "text", text: "Hi, I need to book a flight." }] },
      { role: "assistant", content: [{ type: "text", text: "I can help with that. What are your travel dates?" }] },
      { role: "user", content: [{ type: "text", text: "From NYC to LAX, next month." }] },
    ];

    const summary = await summarizer.summarizeContext(history);
    expect(summary).toContain("flight");
    expect(summary).toContain("NYC to LAX");
  });

  it("should focus the summary on a specific intent when provided", async () => {
    const summarizer = new ContextualHistorySummarizerWithIntentFocus("test-model");
    const history: any[] = [
      { role: "user", content: [{ type: "text", text: "First, let's discuss my vacation plans." }] },
      { role: "assistant", content: [{ type: "text", text: "Sounds fun! Where are you thinking of going?" }] },
      { role: "user", content: [{ type: "text", text: "I'm interested in hiking in Colorado." }] },
      { role: "assistant", content: [{ type: "text", text: "Colorado is beautiful. Do you have dates?" }] },
      { role: "user", content: [{ type: "text", text: "Actually, I also need to check my bank balance." }] },
    ];
    const intent = "bank balance";

    const summary = await summarizer.summarizeContext(history, intent);
    expect(summary).toContain("bank balance");
    expect(summary).not.toContain("vacation");
  });

  it("should handle empty history gracefully", async () => {
    const summarizer = new ContextualHistorySummarizerWithIntentFocus("test-model");
    const history: any[] = [];

    const summary = await summarizer.summarizeContext(history);
    expect(summary).toBe("No context provided to summarize.");
  });
});