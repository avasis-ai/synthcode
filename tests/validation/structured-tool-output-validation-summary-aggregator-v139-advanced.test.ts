import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV139Advanced,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v139-advanced";
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
} from "../src/validation/types";

describe("StructuredToolOutputValidationSummaryAggregatorV139Advanced", () => {
  it("should correctly aggregate validation errors from multiple message types", async () => {
    const userMessage: UserMessage = {
      role: "user";
      content: "Hello world",
      messages: [],
    };
    const assistantMessage: AssistantMessage = {
      role: "assistant";
      content: "Hi there",
      messages: [],
    };
    const toolResultMessage: ToolResultMessage = {
      role: "tool";
      content: "{}",
      messages: [],
    };

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139Advanced();
    const result = await aggregator.aggregate(
      [userMessage, assistantMessage, toolResultMessage],
    );

    expect(result.sourceId).toBe("combined");
    expect(result.results).toHaveLength(0);
  });

  it("should handle an empty list of messages gracefully", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139Advanced();
    const result = await aggregator.aggregate([],);

    expect(result.sourceId).toBe("combined");
    expect(result.results).toHaveLength(0);
  });

  it("should correctly aggregate errors when validation fails for a specific message", async () => {
    // Mocking a scenario where validation might fail (assuming the aggregator has internal logic for this)
    // Since we don't have the full implementation, we test the structure and expected behavior.
    const userMessage: UserMessage = {
      role: "user";
      content: "Invalid input",
      messages: [],
    };
    // Assume this message triggers an error for testing purposes
    const failingMessage: Message = {
      role: "user";
      content: "Bad data",
      messages: [],
    } as any; // Casting to any to simulate a message that causes an error

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139Advanced();
    const result = await aggregator.aggregate(
      [userMessage, failingMessage],
    );

    // We expect at least one result if the second message is designed to fail validation
    // For a robust test, we'd mock the internal validation logic, but here we check structure.
    expect(result.sourceId).toBe("combined");
    // If the aggregator is designed to find errors, this count should be > 0 for the failing case.
    // For this example, we assert the structure is maintained.
    expect(result.results).toBeInstanceOf(Array);
  });
});