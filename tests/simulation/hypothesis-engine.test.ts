import { describe, it, expect } from "vitest"
import { HypothesisEngine } from "../src/simulation/hypothesis-engine"

describe("HypothesisEngine", () => {
  it("should calculate a basic hypothesis score correctly", () => {
    const engine = new HypothesisEngine()
    const context = [
      {
        role: "user",
        content: [
          { type: "text", content: "What is the capital of France?" },
        ],
      },
    ]
    const candidateAction = {
      name: "search_web",
      input: { query: "capital of France" },
      description: "Searches the web for information.",
    }
    const hypothesis = {
      candidate: candidateAction,
      predictedCost: 5,
      contextualRelevanceScore: 0.8,
      constraintSatisfactionScore: 0.9,
      finalScore: 0,
      simulatedOutput: [{ type: "text", content: "Paris" }],
    }

    // Mock the internal calculation logic if necessary, or test the public interface
    // Assuming the engine has a method to process and score a hypothesis
    // Since the full class implementation isn't provided, we'll test the expected behavior
    // based on the structure and typical usage of such an engine.
    // We assume a method like 'scoreHypothesis' exists.
    const scoredHypothesis = engine.scoreHypothesis(hypothesis)

    // Simple assertion based on expected score calculation (e.g., weighted average)
    expect(scoredHypothesis.finalScore).toBeCloseTo(
      0.8 * 0.4 + 0.9 * 0.4 + 5 * 0.2, 
      2
    )
  })

  it("should handle low relevance and high cost appropriately", () => {
    const engine = new HypothesisEngine()
    const context = [
      {
        role: "user",
        content: [
          { type: "text", content: "Tell me about quantum physics." },
        ],
      },
    ]
    const candidateAction = {
      name: "search_web",
      input: { query: "ancient history" }, // Irrelevant query
      description: "Searches the web for information.",
    }
    const hypothesis = {
      candidate: candidateAction,
      predictedCost: 20, // High cost
      contextualRelevanceScore: 0.1, // Low relevance
      constraintSatisfactionScore: 0.5,
      finalScore: 0,
      simulatedOutput: [{ type: "text", content: "Irrelevant data" }],
    }

    const scoredHypothesis = engine.scoreHypothesis(hypothesis)

    // Expect the score to be penalized due to low relevance and high cost
    expect(scoredHypothesis.finalScore).toBeLessThan(0.5)
  })

  it("should prioritize hypotheses with high constraint satisfaction", () => {
    const engine = new HypothesisEngine()
    const context = [
      {
        role: "user",
        content: [
          { type: "text", content: "What are the steps to bake bread?" },
        ],
      },
    ]
    
    // Hypothesis A: High satisfaction, moderate score
    const hypothesisA = {
      candidate: { name: "recipe_lookup", input: {}, description: "Finds recipes." },
      predictedCost: 5,
      contextualRelevanceScore: 0.7,
      constraintSatisfactionScore: 0.95, // High
      finalScore: 0,
      simulatedOutput: [{ type: "text", content: "Steps for bread" }],
    }

    // Hypothesis B: Low satisfaction, high score
    const hypothesisB = {
      candidate: { name: "general_knowledge", input: {}, description: "General info." },
      predictedCost: 1,
      contextualRelevanceScore: 0.9,
      constraintSatisfactionScore: 0.4, // Low
      finalScore: 0,
      simulatedOutput: [{ type: "text", content: "General info" }],
    }

    // Assuming the engine can compare and select the best hypothesis
    const bestHypothesis = engine.selectBestHypothesis([hypothesisA, hypothesisB], context)

    // Expect Hypothesis A to be selected because constraint satisfaction is often critical
    expect(bestHypothesis.candidate.name).toBe("recipe_lookup")
  })
})