import { describe, it, expect } from "vitest";
import {
  calculateDiff,
  ContextualStateDiffCalculator,
} from "../src/context/contextual-state-diffing-v105";

describe("calculateDiff", () => {
  it("should calculate a diff when only the message history changes", () => {
    const currentState = {
      messageHistory: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      resourceUsage: { cpuUsageMs: 100, memoryUsageBytes: 1024 },
    };
    const previousState = {
      messageHistory: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      resourceUsage: { cpuUsageMs: 100, memoryUsageBytes: 1024 },
    };
    const context = {
      messageHistory: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      // Add other context properties if necessary for the function signature
    };

    const diff = calculateDiff(currentState, previousState, context);
    expect(diff).toEqual({
      messageHistory: {
        diff: [],
        // Assuming the diff structure for messageHistory is an array of changes
      },
      resourceUsage: null,
    });
  });

  it("should calculate a diff when resource usage changes", () => {
    const currentState = {
      messageHistory: [
        { role: "user", content: "Query" },
      ],
      resourceUsage: { cpuUsageMs: 250, memoryUsageBytes: 2048 },
    };
    const previousState = {
      messageHistory: [
        { role: "user", content: "Query" },
      ],
      resourceUsage: { cpuUsageMs: 100, memoryUsageBytes: 512 },
    };
    const context = {
      messageHistory: [
        { role: "user", content: "Query" },
      ],
    };

    const diff = calculateDiff(currentState, previousState, context);
    expect(diff).toEqual({
      messageHistory: null,
      resourceUsage: {
        diff: {
          cpuUsageMs: {
            diff: 150,
          },
          memoryUsageBytes: {
            diff: 1536,
          },
        },
      },
    });
  });

  it("should return no diff if both states are identical", () => {
    const currentState = {
      messageHistory: [
        { role: "user", content: "Test" },
      ],
      resourceUsage: { cpuUsageMs: 50, memoryUsageBytes: 512 },
    };
    const previousState = {
      messageHistory: [
        { role: "user", content: "Test" },
      ],
      resourceUsage: { cpuUsageMs: 50, memoryUsageBytes: 512 },
    };
    const context = {
      messageHistory: [
        { role: "user", content: "Test" },
      ],
    };

    const diff = calculateDiff(currentState, previousState, context);
    expect(diff).toEqual({
      messageHistory: null,
      resourceUsage: null,
    });
  });
});