import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV8 } from "../src/context/contextual-state-diffing-v8";

describe("ContextualStateDiffingV8", () => {
  it("should correctly calculate the diff when only the last message changes", () => {
    const initialContext: any = {
      userId: "user123",
      sessionId: "sessionABC",
      messages: [
        { type: "user", content: "Hello", timestamp: 1678886400 },
        { type: "assistant", content: "Hi there!", timestamp: 1678886460 },
      ],
      lastMessageTimestamp: 1678886460,
    };
    const updatedContext: any = {
      userId: "user123",
      sessionId: "sessionABC",
      messages: [
        { type: "user", content: "Hello", timestamp: 1678886400 },
        { type: "assistant", content: "Updated response!", timestamp: 1678886500 },
      ],
      lastMessageTimestamp: 1678886500,
    };

    const diffReport = ContextualStateDiffingV8.generateDiffReport(initialContext, updatedContext);

    expect(diffReport.diffedMessages).toHaveLength(1);
    expect(diffReport.diffedMessages[0].message).toEqual(
      expect.objectContaining({ type: "assistant", content: "Updated response!", timestamp: 1678886500 })
    );
  });

  it("should report no diff when context remains unchanged", () => {
    const context: any = {
      userId: "user123",
      sessionId: "sessionABC",
      messages: [
        { type: "user", content: "Hello", timestamp: 1678886400 },
        { type: "assistant", content: "Hi there!", timestamp: 1678886460 },
      ],
      lastMessageTimestamp: 1678886460,
    };

    const diffReport = ContextualStateDiffingV8.generateDiffReport(context, context);

    expect(diffReport.diffedMessages).toHaveLength(0);
  });

  it("should report diff for an added message when the history grows", () => {
    const initialContext: any = {
      userId: "user123",
      sessionId: "sessionABC",
      messages: [
        { type: "user", content: "Initial query", timestamp: 1678886400 },
      ],
      lastMessageTimestamp: 1678886400,
    };
    const updatedContext: any = {
      userId: "user123",
      sessionId: "sessionABC",
      messages: [
        { type: "user", content: "Initial query", timestamp: 1678886400 },
        { type: "assistant", content: "Follow up response", timestamp: 1678886500 },
      ],
      lastMessageTimestamp: 1678886500,
    };

    const diffReport = ContextualStateDiffingV8.generateDiffReport(initialContext, updatedContext);

    expect(diffReport.diffedMessages).toHaveLength(1);
    expect(diffReport.diffedMessages[0].message).toEqual(
      expect.objectContaining({ type: "assistant", content: "Follow up response", timestamp: 1678886500 })
    );
  });
});