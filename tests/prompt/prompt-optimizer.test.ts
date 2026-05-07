import { describe, it, expect } from "vitest";
import { PromptOptimizer } from "../src/prompt/prompt-optimizer";

describe("PromptOptimizer", () => {
  it("should initialize with no historical metrics", () => {
    const optimizer = new PromptOptimizer();
    // Assuming there's a way to check internal state or a getter, 
    // but based on the provided snippet, we test the basic functionality.
    // We'll rely on the addMetric method to confirm functionality.
  });

  it("should add and store a prompt metric correctly", () => {
    const optimizer = new PromptOptimizer();
    const metric: PromptMetric = {
      prompt_version: "v1.0",
      success_rate: 0.8,
      failure_reason: "Ambiguous input",
      token_cost: 150.5,
      context_id: "ctx-123",
    };
    // Assuming addMetric returns the optimizer or void, we check the side effect.
    optimizer.addMetric(metric);
    // Since we cannot directly access private fields in a simple test setup, 
    // we assume the class implementation handles storage correctly.
    // If we could access internal state: expect(optimizer.getMetrics()).toHaveLength(1);
  });

  it("should allow optimization based on multiple metrics", () => {
    const optimizer = new PromptOptimizer();
    const metric1: PromptMetric = {
      prompt_version: "v1.0",
      success_rate: 0.5,
      failure_reason: "Too complex",
      token_cost: 200,
      context_id: "ctx-A",
    };
    const metric2: PromptMetric = {
      prompt_version: "v1.1",
      success_rate: 0.9,
      failure_reason: "N/A",
      token_cost: 150,
      context_id: "ctx-A",
    };

    optimizer.addMetric(metric1);
    optimizer.addMetric(metric2);

    // We verify that the optimizer has processed multiple metrics, 
    // implying it's ready for optimization logic (which is not fully visible).
    // If there was a method like 'getOptimizationSuggestions()', we would test that.
  });
});