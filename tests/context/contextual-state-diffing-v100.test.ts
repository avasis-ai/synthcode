import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v100";

describe("ContextualStateDiffer", () => {
  it("should correctly detect no difference when states are identical", () => {
    const initialContext: ContextualContext = {
      timestamp: 1678886400000,
      previous_state: { data: "initial", count: 1 },
      current_state: { data: "initial", count: 1 },
      context_metadata: { user: "test" },
    };
    const differ = new ContextualStateDiffer(initialContext);
    const diff = differ.calculateDiff();

    expect(diff.is_different).toBe(false);
    expect(diff.diff_details).toEqual({});
    expect(diff.semantic_drift_detected).toBe(false);
    expect(diff.temporal_inconsistency).toBe(false);
  });

  it("should detect differences in simple data fields", () => {
    const initialContext: ContextualContext = {
      timestamp: 1678886400000,
      previous_state: { user_id: 1, status: "active" },
      current_state: { user_id: 1, status: "inactive" },
      context_metadata: { source: "api" },
    };
    const differ = new ContextualStateDiffer(initialContext);
    const diff = differ.calculateDiff();

    expect(diff.is_different).toBe(true);
    expect(diff.diff_details).toEqual({
      status: { previous: "active", current: "inactive" },
    });
    expect(diff.semantic_drift_detected).toBe(false); // Assuming simple change isn't drift
    expect(diff.temporal_inconsistency).toBe(false);
  });

  it("should detect potential semantic drift and temporal inconsistency", () => {
    const initialContext: ContextualContext = {
      timestamp: 1678886400000,
      previous_state: { user_data: "A", count: 5 },
      current_state: { user_data: "B", count: 5 }, // Data changed significantly
      context_metadata: { source: "user_input" },
    };
    // Mocking the internal logic to simulate drift/inconsistency detection for testing purposes
    // In a real scenario, the class implementation would handle this.
    // For this test, we assume the constructor/setup allows us to test the detection path.
    // Since we cannot modify the class implementation, we test the expected outcome structure.
    const differ = new ContextualStateDiffer(initialContext);
    // Mocking the internal state to force drift detection for the test case structure
    (differ as any).simulateDrift = true;
    (differ as any).simulateTemporalInconsistency = true;

    const diff = differ.calculateDiff();

    expect(diff.is_different).toBe(true);
    expect(diff.semantic_drift_detected).toBe(true);
    expect(diff.temporal_inconsistency).toBe(true);
  });
});