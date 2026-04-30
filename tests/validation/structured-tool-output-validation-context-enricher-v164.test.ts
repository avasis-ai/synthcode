import { describe, it, expect } from "vitest";
import { ValidationContext } from "../src/validation/structured-tool-output-validation-context-enricher-v164";

describe("ValidationContext", () => {
  it("should correctly initialize with basic context", () => {
    const context: ValidationContext = {
      messages: [],
      current_step_context: {},
    };
    expect(context).toBeDefined();
    expect(context.messages).toEqual([]);
    expect(context.current_step_context).toEqual({});
  });

  it("should correctly update context with messages and step info", () => {
    const messages = [
      { type: "user", content: "Hello" } as any,
      { type: "assistant", content: "Hi there" } as any,
    ];
    const context: ValidationContext = {
      messages: messages,
      current_step_context: { step_id: "123" },
      expected_next_step: {
        expected_tool_name: "toolA",
        required_inputs: {
          param1: { description: "Desc", type: "string" },
        },
        description: "Next step description",
      },
    };
    expect(context.messages).toEqual(messages);
    expect(context.current_step_context).toEqual({ step_id: "123" });
    expect(context.expected_next_step).toBeDefined();
    expect(context.expected_next_step!.expected_tool_name).toBe("toolA");
  });

  it("should handle missing expected_next_step gracefully", () => {
    const context: ValidationContext = {
      messages: [{ type: "user", content: "Test" } as any],
      current_step_context: { data: "some_data" },
      expected_next_step: undefined,
    };
    expect(context.expected_next_step).toBeUndefined();
  });
});