import { describe, it, expect } from "vitest";
import { ProofChain } from "../src/proof/verifiable-proof-engine.js";

describe("ProofChain", () => {
  it("should initialize an empty ProofChain correctly", () => {
    const chain = new ProofChain();
    expect(chain.steps).toEqual([]);
  });

  it("should add a single step to the ProofChain", () => {
    const step = {
      stepId: "step1",
      deductionType: "DirectObservation",
      justification: "Initial observation.",
      evidence: { source: "api" },
      conclusion: "The initial state is observed.",
      precedingSteps: [],
    };
    const chain = new ProofChain();
    chain.addStep(step);
    expect(chain.steps).toHaveLength(1);
    expect(chain.steps[0]).toEqual(step);
  });

  it("should correctly link multiple steps in the ProofChain", () => {
    const step1 = {
      stepId: "step1",
      deductionType: "DirectObservation",
      justification: "Initial observation.",
      evidence: { source: "api" },
      conclusion: "The initial state is observed.",
      precedingSteps: [],
    };
    const step2 = {
      stepId: "step2",
      deductionType: "ContextualInference",
      justification: "Inferred from step 1.",
      evidence: { context: "step1" },
      conclusion: "A deduction is made based on the initial state.",
      precedingSteps: ["step1"],
    };
    const chain = new ProofChain();
    chain.addStep(step1);
    chain.addStep(step2);
    expect(chain.steps).toHaveLength(2);
    expect(chain.steps[1].precedingSteps).toEqual(["step1"]);
  });
});