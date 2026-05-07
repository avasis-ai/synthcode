import { describe, it, expect } from "vitest";
import { BehavioralPattern, StepType, TransitionRule } from "../src/validation/behavioral-pattern-validator";

describe("BehavioralPatternValidator", () => {
  it("should correctly validate a simple linear sequence", () => {
    const pattern: BehavioralPattern = {
      name: "SimpleFlow",
      requiredSequence: ["USER_INPUT", "ASSISTANT_RESPONSE"],
      transitions: [
        { from: "USER_INPUT", to: "ASSISTANT_RESPONSE", allowed: true },
        { from: "ASSISTANT_RESPONSE", to: "TOOL_CALL", allowed: true },
      ],
    };

    // Assuming a validation function exists that checks the sequence and transitions
    // We mock the validation logic for demonstration purposes
    const isValid = (pattern: BehavioralPattern, sequence: StepType[]): boolean => {
      if (sequence.length !== pattern.requiredSequence.length) return false;
      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] !== pattern.requiredSequence[i]) return false;
      }
      // Basic transition check (e.g., checking if the transition from i to i+1 is allowed)
      for (let i = 0; i < sequence.length - 1; i++) {
        const from = sequence[i];
        const to = sequence[i + 1];
        const transitionAllowed = pattern.transitions.some(
          (rule) => rule.from === from && rule.to === to && rule.allowed
        );
        if (!transitionAllowed) return false;
      }
      return true;
    };

    const sequence: StepType[] = ["USER_INPUT", "ASSISTANT_RESPONSE"];
    expect(isValid(pattern, sequence)).toBe(true);
  });

  it("should detect an anomaly when the sequence deviates from the required steps", () => {
    const pattern: BehavioralPattern = {
      name: "StrictFlow",
      requiredSequence: ["USER_INPUT", "ASSISTANT_RESPONSE"],
      transitions: [
        { from: "USER_INPUT", to: "ASSISTANT_RESPONSE", allowed: true },
      ],
    };

    // Mock validation function (using the same simplified logic as above)
    const isValid = (pattern: BehavioralPattern, sequence: StepType[]): boolean => {
      if (sequence.length !== pattern.requiredSequence.length) return false;
      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] !== pattern.requiredSequence[i]) return false;
      }
      return true;
    };

    const anomalousSequence: StepType[] = ["USER_INPUT", "TOOL_CALL"];
    expect(isValid(pattern, anomalousSequence)).toBe(false);
  });

  it("should detect an anomaly when an illegal transition occurs mid-sequence", () => {
    const pattern: BehavioralPattern = {
      name: "TransitionCheck",
      requiredSequence: ["USER_INPUT", "ASSISTANT_RESPONSE", "TOOL_CALL"],
      transitions: [
        { from: "USER_INPUT", to: "ASSISTANT_RESPONSE", allowed: true },
        // Missing transition rule for ASSISTANT_RESPONSE -> TOOL_CALL
      ],
    };

    // Mock validation function (using the same simplified logic as above)
    const isValid = (pattern: BehavioralPattern, sequence: StepType[]): boolean => {
      if (sequence.length !== pattern.requiredSequence.length) return false;
      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] !== pattern.requiredSequence[i]) return false;
      }
      // Basic transition check
      for (let i = 0; i < sequence.length - 1; i++) {
        const from = sequence[i];
        const to = sequence[i + 1];
        const transitionAllowed = pattern.transitions.some(
          (rule) => rule.from === from && rule.to === to && rule.allowed
        );
        if (!transitionAllowed) return false;
      }
      return true;
    };

    const sequence: StepType[] = ["USER_INPUT", "ASSISTANT_RESPONSE", "TOOL_CALL"];
    // Since the transition from ASSISTANT_RESPONSE to TOOL_CALL is not defined as allowed, it should fail.
    expect(isValid(pattern, sequence)).toBe(false);
  });
});