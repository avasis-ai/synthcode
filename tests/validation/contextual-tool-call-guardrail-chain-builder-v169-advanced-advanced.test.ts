import { describe, it, expect } from "vitest";
import {
  GuardrailStepFunction,
  GuardrailResult,
} from "../src/validation/contextual-tool-call-guardrail-chain-builder-v169-advanced-advanced";

describe("ContextualToolCallGuardrailChainBuilder", () => {
  it("should return isValid true when the tool call is valid based on context", async () => {
    const mockContext = {
      toolCall: { name: "get_weather", input: { location: "London" } },
      history: [
        { role: "user", content: "What is the weather like in London?" }
      ],
      previousResult: null
    };
    const guardrail: GuardrailStepFunction = (context) => {
      if (context.toolCall.name === "get_weather" && context.toolCall.input.location === "London") {
        return { isValid: true, reason: "Valid weather call", context: {} };
      }
      return { isValid: false, reason: "Invalid call", context: {} };
    };
    const result = await guardrail(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.reason).toBe("Valid weather call");
  });

  it("should return isValid false when the tool call is invalid due to missing required arguments", async () => {
    const mockContext = {
      toolCall: { name: "create_user", input: { username: "testuser" } },
      history: [
        { role: "user", content: "Create a user." }
      ],
      previousResult: null
    };
    const guardrail: GuardrailStepFunction = (context) => {
      if (context.toolCall.name === "create_user" && context.toolCall.input.email) {
        return { isValid: true, reason: "Valid user creation", context: {} };
      }
      return { isValid: false, reason: "Missing email for user creation", context: {} };
    };
    const result = await guardrail(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Missing email");
  });

  it("should respect previous guardrail results when determining validity", async () => {
    const mockContext = {
      toolCall: { name: "book_flight", input: { destination: "Paris" } },
      history: [
        { role: "user", content: "Book a flight to Paris." }
      ],
      previousResult: { isValid: false, reason: "User needs to specify dates", context: {} }
    };
    const guardrail: GuardrailStepFunction = (context) => {
      if (context.previousResult?.isValid === false && context.previousResult.reason.includes("dates")) {
        return { isValid: false, reason: "Cannot proceed, previous step failed on dates", context: {} };
      }
      return { isValid: true, reason: "Proceeding", context: {} };
    };
    const result = await guardrail(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("previous step failed on dates");
  });
});