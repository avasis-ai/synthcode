import { describe, it, expect } from "vitest";
import { ContextualEventSourcingValidatorAdvanced } from "../src/validation/contextual-event-sourcing-validator-advanced";
import { Message } from "../src/validation/types";

describe("ContextualEventSourcingValidatorAdvanced", () => {
  it("should pass validation when all causal rules are met", () => {
    const rules = {
      causalRules: [
        {
          precedingEventType: "USER_MESSAGE",
          requiredFollowingEventType: "ASSISTANT_MESSAGE",
          description: "User message must be followed by assistant message",
        },
      ],
    };
    const validator = new ContextualEventSourcingValidatorAdvanced(rules);
    const events: Message[] = [
      { type: "USER_MESSAGE", payload: { content: "Hello" } },
      { type: "ASSISTANT_MESSAGE", payload: { content: "Hi there!" } },
    ];
    expect(validator.isValid(events)).toBe(true);
  });

  it("should fail validation when a required following event type is missing", () => {
    const rules = {
      causalRules: [
        {
          precedingEventType: "USER_MESSAGE",
          requiredFollowingEventType: "ASSISTANT_MESSAGE",
          description: "User message must be followed by assistant message",
        },
      ],
    };
    const validator = new ContextualEventSourcingValidatorAdvanced(rules);
    const events: Message[] = [
      { type: "USER_MESSAGE", payload: { content: "Hello" } },
      // Missing ASSISTANT_MESSAGE
      { type: "TOOL_RESULT_MESSAGE", payload: { result: "ok" } },
    ];
    expect(validator.isValid(events)).toBe(false);
  });

  it("should pass validation when no causal rules are defined", () => {
    const rules = {
      causalRules: [],
    };
    const validator = new ContextualEventSourcingValidatorAdvanced(rules);
    const events: Message[] = [
      { type: "USER_MESSAGE", payload: { content: "Any message" } },
      { type: "TOOL_RESULT_MESSAGE", payload: { result: "ok" } },
    ];
    expect(validator.isValid(events)).toBe(true);
  });
});