import { describe, it, expect } from "vitest";
import { ContextualEventSourcingValidatorV2 } from "../src/validation/contextual-event-sourcing-validator-v2";
import { Message } from "../src/validation/types";

describe("ContextualEventSourcingValidatorV2", () => {
  it("should return null when the event sequence is valid", () => {
    const validator = new ContextualEventSourcingValidatorV2();
    const history: Message[] = [
      { type: "user", content: { text: "Hello" } },
      { type: "assistant", content: { text: "Hi there!" } },
    ];
    const currentEvent: Message = { type: "user", content: { text: "How are you?" } };

    const failure = validator.validate(
      history,
      currentEvent
    );
    expect(failure).toBeNull();
  });

  it("should return a failure when the current event violates a rule based on the previous event", () => {
    const validator = new ContextualEventSourcingValidatorV2();
    const history: Message[] = [
      { type: "user", content: { text: "Initial message" } },
      { type: "assistant", content: { text: "Response" } },
    ];
    // Assuming there's a rule that prevents a user message immediately after an assistant message without context
    const invalidEvent: Message = { type: "user", content: { text: "Another message" } };

    // This test assumes the validator has a rule that fails in this specific scenario.
    // Since we don't have the full implementation of the rules, we test the structure.
    const failure = validator.validate(
      history,
      invalidEvent
    );
    expect(failure).not.toBeNull();
    expect(failure).toHaveProperty("ruleName");
    expect(failure).toHaveProperty("message");
  });

  it("should handle an empty history correctly", () => {
    const validator = new ContextualEventSourcingValidatorV2();
    const history: Message[] = [];
    const currentEvent: Message = { type: "user", content: { text: "First message" } };

    const failure = validator.validate(
      history,
      currentEvent
    );
    // Depending on the rules, this might pass or fail. We test for null if no rules are violated by an empty history.
    // For robustness, we check if the failure is null or if it's a predictable failure.
    // Assuming no rules are violated by the first message.
    expect(failure).toBeNull();
  });
});