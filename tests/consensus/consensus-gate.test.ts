import { describe, it, expect } from "vitest";
import { ConsensusGate } from "../src/consensus/consensus-gate";

describe("ConsensusGate", () => {
  it("should initialize correctly and transition to WAITING_FOR_VOTES", () => {
    const policy = {
      requiredApprovals: 2,
      maxVetoes: 1,
      totalExperts: 3,
    };
    const gate = new ConsensusGate(policy);
    expect(gate.getState()).toBe("PENDING");

    gate.startVoting();
    expect(gate.getState()).toBe("WAITING_FOR_VOTES");
  });

  it("should transition to APPROVED when enough approvals are gathered", () => {
    const policy = {
      requiredApprovals: 2,
      maxVetoes: 1,
      totalExperts: 3,
    };
    const gate = new ConsensusGate(policy);
    gate.startVoting();

    // Simulate 2 approvals
    gate.recordVote({ expertId: "expert1", voteType: "APPROVAL", weight: 1 });
    gate.recordVote({ expertId: "expert2", voteType: "APPROVAL", weight: 1 });

    expect(gate.getState()).toBe("APPROVED");
  });

  it("should transition to VETOED when too many vetoes are gathered", () => {
    const policy = {
      requiredApprovals: 3,
      maxVetoes: 1,
      totalExperts: 3,
    };
    const gate = new ConsensusGate(policy);
    gate.startVoting();

    // Simulate 2 vetoes (exceeds maxVetoes of 1)
    gate.recordVote({ expertId: "expert1", voteType: "VETO", weight: 1 });
    gate.recordVote({ expertId: "expert2", voteType: "VETO", weight: 1 });

    expect(gate.getState()).toBe("VETOED");
  });
});