import { describe, it, expect } from "vitest";
import { ResourceConflictNegotiator } from "../src/negotiation/resource-conflict-negotiator";

describe("ResourceConflictNegotiator", () => {
  it("should initialize with correct state and parties", () => {
    const negotiator = new ResourceConflictNegotiator(["P1", "P2"]);
    expect(negotiator.getState()).toBe("INITIAL");
    expect(negotiator.getParties()).toEqual(["P1", "P2"]);
  });

  it("should process a conflict proposal and update the state", () => {
    const negotiator = new ResourceConflictNegotiator(["P1", "P2"]);
    const proposal = {
      proposerId: "P1",
      allocations: {
        "ResourceA": { owner: "P1", amount: 10 },
      },
      utilityGains: {
        "P1": 5,
        "P2": 2,
      },
      reasoning: "P1 needs more resources.",
    };
    negotiator.processProposal(proposal);
    expect(negotiator.getState()).toBe("PROPOSAL_RECEIVED");
  });

  it("should handle multiple proposals and maintain the current allocation", () => {
    const negotiator = new ResourceConflictNegotiator(["P1", "P2"]);
    const proposal1 = {
      proposerId: "P1",
      allocations: {
        "ResourceA": { owner: "P1", amount: 10 },
      },
      utilityGains: {
        "P1": 5,
        "P2": 2,
      },
      reasoning: "Initial proposal.",
    };
    negotiator.processProposal(proposal1);

    const proposal2 = {
      proposerId: "P2",
      allocations: {
        "ResourceA": { owner: "P2", amount: 10 },
      },
      utilityGains: {
        "P1": 1,
        "P2": 8,
      },
      reasoning: "Counter-proposal.",
    };
    negotiator.processProposal(proposal2);
    expect(negotiator.getState()).toBe("PROPOSAL_RECEIVED");
  });
});