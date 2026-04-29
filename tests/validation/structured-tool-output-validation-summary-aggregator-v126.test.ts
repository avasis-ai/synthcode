import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV126,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v126";
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/validation/types";

describe("StructuredToolOutputValidationSummaryAggregatorV126", () => {
  it("should correctly aggregate validation results when all inputs are valid", async () => {
    const userMessage: UserMessage = {
      id: "user1",
      role: "user",
      content: "Test user input",
    };
    const assistantMessage: AssistantMessage = {
      id: "assistant1",
      role: "assistant",
      content: "Test assistant response",
    };
    const toolResultMessage: ToolResultMessage = {
      id: "tool1",
      role: "tool",
      content: "Tool result content",
    };

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV126();
    const results = await aggregator.aggregate(
      [userMessage, assistantMessage, toolResultMessage],
    );

    expect(results.overallIsValid).toBe(true);
    expect(results.summaryEntries.length).toBe(3);
    expect(results.summaryEntries.every(
      (entry) => entry.isSuccessful === true && entry.errorCount === 0,
    )).toBe(true);
  });

  it("should correctly aggregate validation results when some inputs are invalid", async () => {
    const userMessage: UserMessage = {
      id: "user1",
      role: "user",
      content: "Valid user input",
    };
    const invalidAssistantMessage: AssistantMessage = {
      id: "assistant1",
      role: "assistant",
      content: "Invalid content",
    };
    const toolResultMessage: ToolResultMessage = {
      id: "tool1",
      role: "tool",
      content: "Valid tool result",
    };

    // Mocking the validation logic to force an error for the assistant message
    // In a real scenario, the aggregator would call an underlying validator.
    // Here we simulate the expected failure structure.
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV126();
    const results = await aggregator.aggregate(
      [userMessage, invalidAssistantMessage, toolResultMessage],
    );

    expect(results.overallIsValid).toBe(false);
    expect(results.summaryEntries.length).toBe(3);

    // Check the specific entry that should fail (assuming the aggregator processes them in order)
    const failedEntry = results.summaryEntries.find(
      (entry) => entry.sourceId === "assistant1",
    );
    expect(failedEntry).toBeDefined();
    expect(failedEntry!.isSuccessful).toBe(false);
    expect(failedEntry!.errorCount).toBeGreaterThan(0);
  });

  it("should handle an empty list of messages gracefully", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV126();
    const results = await aggregator.aggregate([]);

    expect(results.overallIsValid).toBe(true);
    expect(results.summaryEntries).toEqual([]);
    expect(results.totalErrorCount).toBe(0);
  });
});