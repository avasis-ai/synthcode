import { describe, it, expect } from "vitest";
import { CritiqueContext, CritiqueResult } from "../src/critique/critique-engine.js";
import { critiqueEngine } from "../src/critique/critique-engine.js";

describe("critiqueEngine", () => {
  it("should generate a basic critique summary when metrics are normal", () => {
    const context: CritiqueContext = {
      currentState: {
        user: "Alice",
        role: "User",
      },
      currentPlan: ["Step 1", "Step 2"],
      triggerMetrics: {
        confidenceScore: 0.9,
        conflictDetected: false,
        resourceOveruse: 0.1,
        stateDrift: false,
      },
      history: [],
    };

    const result: CritiqueResult = critiqueEngine(context);

    expect(result.critiqueSummary).toContain("The current plan seems sound");
    expect(result.mitigationSteps).toHaveLength(0);
  });

  it("should suggest mitigation steps when conflict is detected", () => {
    const context: CritiqueContext = {
      currentState: {
        user: "Bob",
        role: "User",
      },
      currentPlan: ["Step A", "Step B"],
      triggerMetrics: {
        confidenceScore: 0.5,
        conflictDetected: true,
        resourceOveruse: 0.2,
        stateDrift: false,
      },
      history: [{
        role: "Agent",
        content: "Initial action.",
      }],
    };

    const result: CritiqueResult = critiqueEngine(context);

    expect(result.critiqueSummary).toContain("A potential conflict was detected");
    expect(result.mitigationSteps).toHaveLength(1);
    expect(result.mitigationSteps[0]).toContain("Review the conflict");
  });

  it("should recommend caution when confidence score is low and state drift is true", () => {
    const context: CritiqueContext = {
      currentState: {
        user: "Charlie",
        role: "User",
      },
      currentPlan: ["Step X", "Step Y"],
      triggerMetrics: {
        confidenceScore: 0.3,
        conflictDetected: false,
        resourceOveruse: 0.5,
        stateDrift: true,
      },
      history: [],
    };

    const result: CritiqueResult = critiqueEngine(context);

    expect(result.critiqueSummary).toContain("Caution is advised");
    expect(result.mitigationSteps).toHaveLength(2);
    expect(result.mitigationSteps).toEqual(expect.arrayContaining([
      expect.stringContaining("Re-evaluate the state"),
      expect.stringContaining("Increase confidence"),
    ]));
  });
});