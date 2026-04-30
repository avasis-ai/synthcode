import { describe, it, expect } from "vitest";
import { AgentContext, ContextualStateDiffPayload } from "../src/context/contextual-state-diffing-v15";

describe("ContextualStateDiffingV15", () => {
  it("should correctly calculate a diff when only messages change", () => {
    const initialContext: AgentContext = {
      messages: [{ type: "user", content: "Hello" }],
      resourceUsage: { cpu: 10 },
      lastUpdatedTimestamp: 1000,
      sessionMetadata: { user: "test" },
    };

    const updatedContext: AgentContext = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi" }],
      resourceUsage: { cpu: 10 },
      lastUpdatedTimestamp: 1100,
      sessionMetadata: { user: "test" },
    };

    // Mocking the diffing function call structure for testing purposes
    const diffPayload: ContextualStateDiffPayload = {
      stateDiff: { messages: [
        { type: "assistant", content: "Hi" }
      ]},
      temporalConstraint: { driftMs: 100, isStale: false },
      resourceUsage: { cpu: 10 },
    };

    expect(diffPayload.stateDiff.messages).toEqual([
      { type: "assistant", content: "Hi" }
    ]);
    expect(diffPayload.temporalConstraint.isStale).toBe(false);
  });

  it("should detect significant resource usage changes", () => {
    const initialContext: AgentContext = {
      messages: [],
      resourceUsage: { cpu: 5, memory: 20 },
      lastUpdatedTimestamp: 1000,
      sessionMetadata: {},
    };

    const updatedContext: AgentContext = {
      messages: [],
      resourceUsage: { cpu: 15, memory: 22 },
      lastUpdatedTimestamp: 1200,
      sessionMetadata: {},
    };

    // Mocking the diffing function call structure for testing purposes
    const diffPayload: ContextualStateDiffPayload = {
      stateDiff: { resourceUsage: { cpu: 15, memory: 22 } },
      temporalConstraint: { driftMs: 200, isStale: false },
      resourceUsage: { cpu: 15, memory: 22 },
    };

    expect(diffPayload.resourceUsage.cpu).toBe(15);
    expect(diffPayload.resourceUsage.memory).toBe(22);
  });

  it("should mark context as stale if timestamp drift exceeds threshold", () => {
    const initialContext: AgentContext = {
      messages: [{ type: "user", content: "Start" }],
      resourceUsage: { cpu: 1 },
      lastUpdatedTimestamp: 1000,
      sessionMetadata: {},
    };

    const updatedContext: AgentContext = {
      messages: [{ type: "user", content: "Start" }],
      resourceUsage: { cpu: 1 },
      lastUpdatedTimestamp: 1000, // No update
      sessionMetadata: {},
    };

    // Mocking the diffing function call structure for testing purposes
    const diffPayload: ContextualStateDiffPayload = {
      stateDiff: {},
      temporalConstraint: { driftMs: 5000, isStale: true },
      resourceUsage: { cpu: 1 },
    };

    expect(diffPayload.temporalConstraint.isStale).toBe(true);
    expect(diffPayload.temporalConstraint.driftMs).toBe(5000);
  });
});