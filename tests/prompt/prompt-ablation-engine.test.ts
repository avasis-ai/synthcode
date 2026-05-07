import { describe, it, expect } from "vitest";
import { PromptAblationEngine, PromptVariant, TestContext, TestResult } from "../src/prompt/prompt-ablation-engine";

describe("PromptAblationEngine", () => {
  it("should correctly calculate results for a single variant", async () => {
    const engine = new PromptAblationEngine();
    const context: TestContext = {
      history: [{ role: "user", content: "Hello" }],
      contextData: { user_id: "123" },
    };
    const variant: PromptVariant = {
      name: "Basic",
      template: "Generate a response for {user_id}.",
      weights: {
        successRate: 0.8,
        costEfficiency: 0.5,
        constraintAdherence: 0.9,
      },
    };

    const result: TestResult = await engine.evaluate(variant, context);

    expect(result.variantName).toBe("Basic");
    expect(typeof result.rawOutput).toBe("string");
    expect(result.metrics).toBeDefined();
    expect(result.metrics.successRate).toBeCloseTo(0.8);
    expect(result.metrics.cost).toBeCloseTo(0.5);
    expect(result.metrics.constraintAdherence).toBeCloseTo(0.9);
  });

  it("should handle multiple variants and select the best one based on weights", async () => {
    const engine = new PromptAblationEngine();
    const context: TestContext = {
      history: [],
      contextData: { topic: "AI" },
    };

    const variants: PromptVariant[] = [
      {
        name: "VariantA",
        template: "Topic: {topic}",
        weights: {
          successRate: 0.9,
          costEfficiency: 0.1,
          constraintAdherence: 0.5,
        },
      },
      {
        name: "VariantB",
        template: "Topic: {topic} (Detailed)",
        weights: {
          successRate: 0.6,
          costEfficiency: 0.8,
          constraintAdherence: 0.9,
        },
      },
    ];

    // Assuming VariantB is better overall due to higher combined weights
    const bestResult: TestResult = await engine.evaluateBest(variants, context);

    expect(bestResult.variantName).toBe("VariantB");
    expect(bestResult.metrics.successRate).toBeCloseTo(0.6);
    expect(bestResult.metrics.cost).toBeCloseTo(0.8);
  });

  it("should return default or empty results if no variants are provided", async () => {
    const engine = new PromptAblationEngine();
    const context: TestContext = {
      history: [],
      contextData: {},
    };
    const variants: PromptVariant[] = [];

    const bestResult: TestResult = await engine.evaluateBest(variants, context);

    expect(bestResult).toBeNull();
  });
});