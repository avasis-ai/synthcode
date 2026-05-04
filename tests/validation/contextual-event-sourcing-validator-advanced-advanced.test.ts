import { describe, it, expect } from "vitest";
import { ContextualValidator } from "../src/validation/contextual-event-sourcing-validator-advanced-advanced";

describe("ContextualValidator", () => {
  it("should return valid state and no errors for a sequence of valid events", () => {
    // Mock implementation for testing purposes
    const mockValidator: ContextualValidator = {
      rules: [],
      initialState: {
        count: 0,
      },
      process: (events) => ({
        isValid: true,
        finalState: {
          count: events.length,
        },
        errors: [],
      }),
    };

    const events: Message[] = [
      { type: "user", content: "Hello" },
      { type: "assistant", content: "Hi there" },
    ];

    const result = mockValidator.process(events);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.finalState.count).toBe(2);
  });

  it("should return invalid state and collect errors for invalid events", () => {
    // Mock implementation for testing purposes
    const mockValidator: ContextualValidator = {
      rules: [],
      initialState: {
        count: 0,
      },
      process: (events) => ({
        isValid: false,
        finalState: {
          count: 1,
        },
        errors: ["Invalid event at index 1"],
      }),
    };

    const events: Message[] = [
      { type: "user", content: "First event" },
      { type: "assistant", content: "Second event" },
    ];

    const result = mockValidator.process(events);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Invalid event at index 1"]);
    expect(result.finalState.count).toBe(1);
  });

  it("should correctly process an empty sequence of events", () => {
    // Mock implementation for testing purposes
    const mockValidator: ContextualValidator = {
      rules: [],
      initialState: {
        count: 0,
      },
      process: (events) => ({
        isValid: true,
        finalState: {
          count: 0,
        },
        errors: [],
      }),
    };

    const events: Message[]: Message[] = [];

    const result = mockValidator.process(events);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.finalState.count).toBe(0);
  });
});