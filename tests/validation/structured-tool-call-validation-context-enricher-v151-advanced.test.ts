import { describe, it, expect } from "vitest";
import { EnrichedValidationContext } from "../src/validation/structured-tool-call-validation-context-enricher-v151-advanced";

describe("EnrichedValidationContext", () => {
  it("should correctly initialize with minimal required fields", () => {
    const context: EnrichedValidationContext = {
      message_history: [{ role: "user", content: "Hello" }],
      current_user_input: "Test input",
    };
    expect(context.message_history).toHaveLength(1);
    expect(context.current_user_input).toBe("Test input");
    expect(context.expected_next_step).toBeUndefined();
    expect(context.plan_context).toBeUndefined();
  });

  it("should correctly include an expected next step", () => {
    const expectedStep = {
      tool_name: "get_weather",
      required_input: { location: "London" },
    };
    const context: EnrichedValidationContext = {
      message_history: [],
      current_user_input: "",
      expected_next_step: expectedStep,
    };
    expect(context.expected_next_step).toEqual(expectedStep);
  });

  it("should correctly include a full plan context", () => {
    const planContext = {
      plan_id: "plan-123",
      steps: [
        {
          step_index: 0,
          expected_tool_name: "search",
          expected_input_schema: { query: "initial search" },
        },
        {
          step_index: 1,
          expected_tool_name: "summarize",
          expected_input_schema: { text: "summary" },
        },
      ],
    };
    const context: EnrichedValidationContext = {
      message_history: [{ role: "assistant", content: "Plan generated" }],
      current_user_input: "Continue",
      plan_context: planContext,
    };
    expect(context.plan_context).toEqual(planContext);
    expect(context.plan_context?.plan_id).toBe("plan-123");
  });
});