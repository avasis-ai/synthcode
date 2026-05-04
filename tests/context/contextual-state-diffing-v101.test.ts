import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV101 } from "../context/contextual-state-diffing-v101";

describe("ContextualStateDiffingV101", () => {
  it("should correctly calculate structural and semantic differences when state changes significantly", () => {
    const initialContext: any = {
      structural: {
        messages: [{ type: "user", content: "Hello" }],
        metadata: { source: "user_input" },
      },
      semantic: {
        embeddings: new Float32Array([0.1, 0.2]),
        intent_vector: new Float32Array([0.3, 0.4]),
      },
    };
    const updatedContext: any = {
      structural: {
        messages: [{ type: "user", content: "How are you?" }],
        metadata: { source: "user_input", timestamp: Date.now() },
      },
      semantic: {
        embeddings: new Float32Array([0.9, 0.8]),
        intent_vector: new Float32Array([0.1, 0.2]),
      },
    };

    const diffResult = ContextualStateDiffingV101.diff(initialContext, updatedContext);

    expect(diffResult.isStructurallySignificant).toBe(true);
    expect(diffResult.semanticDriftScore).toBeCloseTo(0.0); // Assuming the implementation handles this specific change
    expect(diffResult.overallChangeDetected).toBe(true);
  });

  it("should report no significant change when state is identical", () => {
    const context: any = {
      structural: {
        messages: [{ type: "user", content: "Test" }],
        metadata: { source: "test" },
      },
      semantic: {
        embeddings: new Float32Array([0.5, 0.5]),
        intent_vector: new Float32Array([0.5, 0.5]),
      },
    };

    const diffResult = ContextualStateDiffingV101.diff(context, context);

    expect(diffResult.isStructurallySignificant).toBe(false);
    expect(diffResult.semanticDriftScore).toBe(1.0); // Assuming perfect match results in max similarity or specific value
    expect(diffResult.overallChangeDetected).toBe(false);
  });

  it("should detect semantic drift when embeddings change but structure remains the same", () => {
    const initialContext: any = {
      structural: {
        messages: [{ type: "user", content: "Initial query" }],
        metadata: { source: "user_input" },
      },
      semantic: {
        embeddings: new Float32Array([0.1, 0.1]),
        intent_vector: new Float32Array([0.2, 0.2]),
      },
    };
    const updatedContext: any = {
      structural: {
        messages: [{ type: "user", content: "Initial query" }],
        metadata: { source: "user_input" },
      },
      semantic: {
        embeddings: new Float32Array([0.9, 0.9]), // Significant change here
        intent_vector: new Float32Array([0.2, 0.2]),
      },
    };

    const diffResult = ContextualStateDiffingV101.diff(initialContext, updatedContext);

    expect(diffResult.isStructurallySignificant).toBe(false);
    expect(diffResult.semanticDriftScore).toBeLessThan(0.9); // Should detect drift
    expect(diffResult.overallChangeDetected).toBe(true);
  });
});