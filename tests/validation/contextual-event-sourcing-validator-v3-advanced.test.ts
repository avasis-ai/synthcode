import { describe, it, expect } from "vitest";
import { ContextualEventSourcingValidatorV3Advanced } from "../src/validation/contextual-event-sourcing-validator-v3-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../src/validation/types";

describe("ContextualEventSourcingValidatorV3Advanced", () => {
  it("should validate a sequence of events with unique causal IDs", async () => {
    const validator = new ContextualEventSourcingValidatorV3Advanced();
    const events: Message[] = [
      { type: "user", content: "Hello", metadata: { causalId: "id1", timestamp: Date.now() } } as UserMessage,
      { type: "assistant", content: "Hi there", metadata: { causalId: "id2", timestamp: Date.now() } } as AssistantMessage,
      { type: "tool_result", content: "Result", metadata: { causalId: "id3", timestamp: Date.now() } } as ToolResultMessage,
    ];
    const report = await validator.validate(events);
    expect(report.isValid).toBe(true);
    expect(report.violations).toHaveLength(0);
  });

  it("should detect a causal ID conflict in the event sequence", async () => {
    const validator = new ContextualEventSourcingValidatorV3Advanced();
    const events: Message[] = [
      { type: "user", content: "First message", metadata: { causalId: "conflict_id", timestamp: Date.now() } } as UserMessage,
      { type: "assistant", content: "Second message", metadata: { causalId: "conflict_id", timestamp: Date.now() } } as AssistantMessage,
    ];
    const report = await validator.validate(events);
    expect(report.isValid).toBe(false);
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0].reason).toBe("Causal ID conflict");
  });

  it("should detect a temporal violation (out-of-order timestamps)", async () => {
    const validator = new ContextualEventSourcingValidatorV3Advanced();
    const events: Message[] = [
      { type: "user", content: "Early event", metadata: { causalId: "id1", timestamp: 1000 } } as UserMessage,
      { type: "assistant", content: "Later event", metadata: { causalId: "id2", timestamp: 2000 } } as AssistantMessage,
      { type: "tool_result", content: "Reversed event", metadata: { causalId: "id3", timestamp: 500 } } as ToolResultMessage,
    ];
    const report = await validator.validate(events);
    expect(report.isValid).toBe(false);
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0].reason).toBe("Temporal violation");
  });
});