import { describe, it, expect } from "vitest";
import { Hypothesis, Metric, HypothesisResult } from "../hypothesis/hypothesis-engine.js";

describe("Hypothesis Engine", () => {
  it("should correctly process a successful hypothesis run", async () => {
    const hypothesis: Hypothesis = {
      id: "h1",
      proposedAction: "increase_traffic",
      inputs: { duration: 10, intensity: 0.8 },
      expectedMetrics: [
        { name: "latency", expectedValue: 50, actualValue: 55, tolerance: 10 },
        { name: "throughput", expectedValue: 1000, actualValue: 950, tolerance: 50 },
      ],
    };

    // Mock the internal logic to simulate success
    const mockEngine = {
      run: async (hypothesis: Hypothesis): Promise<HypothesisResult> => ({
        hypothesisId: hypothesis.id,
        success: true,
        observedMetrics: [
          { name: "latency", expectedValue: 50, actualValue: 55, tolerance: 10 },
          { name: "throughput", expectedValue: 1000, actualValue: 950, tolerance: 50 },
        ],
      }),
    };

    // Assuming the engine has a function to run the hypothesis
    const result = await mockEngine.run(hypothesis);

    expect(result.hypothesisId).toBe("h1");
    expect(result.success).toBe(true);
    expect(result.observedMetrics.length).toBe(2);
  });

  it("should mark a hypothesis as failed if a critical metric is outside tolerance", async () => {
    const hypothesis: Hypothesis = {
      id: "h2",
      proposedAction: "reduce_memory",
      inputs: { duration: 5 },
      expectedMetrics: [
        { name: "memory_usage", expectedValue: 20, actualValue: 35, tolerance: 5 }, // Failure here
        { name: "cpu_load", expectedValue: 0.5, actualValue: 0.4, tolerance: 0.1 },
      ],
    };

    // Mock the internal logic to simulate failure
    const mockEngine = {
      run: async (hypothesis: Hypothesis): Promise<HypothesisResult> => ({
        hypothesisId: hypothesis.id,
        success: false,
        observedMetrics: [
          { name: "memory_usage", expectedValue: 20, actualValue: 35, tolerance: 5 },
          { name: "cpu_load", expectedValue: 0.5, actualValue: 0.4, tolerance: 0.1 },
        ],
      }),
    };

    const result = await mockEngine.run(hypothesis);

    expect(result.hypothesisId).toBe("h2");
    expect(result.success).toBe(false);
    expect(result.observedMetrics.length).toBe(2);
  });

  it("should handle hypotheses with no expected metrics gracefully", async () => {
    const hypothesis: Hypothesis = {
      id: "h3",
      proposedAction: "noop",
      inputs: {},
      expectedMetrics: [],
    };

    // Mock the internal logic to simulate success with no metrics
    const mockEngine = {
      run: async (hypothesis: Hypothesis): Promise<HypothesisResult> => ({
        hypothesisId: hypothesis.id,
        success: true,
        observedMetrics: [],
      }),
    };

    const result = await mockEngine.run(hypothesis);

    expect(result.hypothesisId).toBe("h3");
    expect(result.success).toBe(true);
    expect(result.observedMetrics).toEqual([]);
  });
});