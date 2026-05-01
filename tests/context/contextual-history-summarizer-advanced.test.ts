import { describe, it, expect } from "vitest";
import { ContextualHistorySummarizerAdvanced } from "../src/context/contextual-history-summarizer-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("ContextualHistorySummarizerAdvanced", () => {
  it("should summarize a simple conversation with clear goals and facts", () => {
    const history: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "Our main goal for this meeting is to finalize the Q3 marketing budget." },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "text", content: "Understood. We also need to review the performance metrics for the new ad campaign." },
        ],
      },
    ];
    const summarizer = new ContextualHistorySummarizerAdvanced(history);
    const summary = summarizer.summarize();

    expect(summary.goals).toContain("finalize the Q3 marketing budget");
    expect(summary.facts).toContain("review the performance metrics for the new ad campaign");
    expect(summary.action_items).toEqual([]);
  });

  it("should extract action items from a detailed discussion", () => {
    const history: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "John needs to draft the initial proposal by next Tuesday." },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "text", content: "And Sarah should follow up with legal regarding the contract terms by EOD Friday." },
        ],
      },
    ];
    const summarizer = new ContextualHistorySummarizerAdvanced(history);
    const summary = summarizer.summarize();

    expect(summary.action_items.length).toBe(2);
    expect(summary.action_items).toEqual(
      expect.arrayContaining([
        { description: "draft the initial proposal", owner: "John", due_date: "next Tuesday" },
        { description: "follow up with legal regarding the contract terms", owner: "Sarah", due_date: "EOD Friday" },
      ])
    );
  });

  it("should handle mixed content including tool use and thinking blocks", () => {
    const history: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "Please analyze the sales data for Q3." },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "thinking", content: "Thinking process: I will use the sales_analyzer tool to get the data." },
          { type: "tool_use", content: "sales_analyzer(quarter='Q3')" },
          { type: "text", content: "The analysis shows a 15% growth, which is good." },
        ],
      },
    ];
    const summarizer = new ContextualHistorySummarizerAdvanced(history);
    const summary = summarizer.summarize();

    expect(summary.goals).toContain("analyze the sales data for Q3");
    expect(summary.facts).toContain("The analysis shows a 15% growth");
    expect(summary.action_items).toEqual([]);
  });
});