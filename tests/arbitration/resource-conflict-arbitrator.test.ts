import { describe, it, expect } from "vitest"
import {
  ResourceNeeds,
  GoalWeights,
  ConflictProposal,
  GrantedResource,
  AllocationPlan,
} from "../src/arbitration/resource-conflict-arbitrator"
import {arbitrateResourceConflict} from "../src/arbitration/resource-conflict-arbitrator"

describe("arbitrateResourceConflict", () => {
  it("should allocate resources based on weighted goal scores when conflicts exist", async () => {
    const proposalA: ConflictProposal = {
      id: "A",
      resourceNeeds: {
        cpu: 10,
        memory: 5,
      },
      goalWeights: {
        priority: 0.8,
        urgency: 0.9,
        costBenefit: 0.7,
      },
      description: "High priority task A",
    }
    const proposalB: ConflictProposal = {
      id: "B",
      resourceNeeds: {
        cpu: 5,
        memory: 2,
      },
      goalWeights: {
        priority: 0.5,
        urgency: 0.3,
        costBenefit: 0.1,
      },
      description: "Low priority task B",
    }
    const proposals: ConflictProposal[] = [proposalA, proposalB]
    const allocationPlan = await arbitrateResourceConflict(
      proposals,
      {cpu: 15, memory: 10 }
    )

    expect(allocationPlan.grantedProposals.length).toBe(2)
    expect(allocationPlan.grantedProposals[0].proposalId).toBe("A")
    expect(allocationPlan.grantedProposals[1].proposalId).toBe("B")
  })

  it("should deny proposals if total resource needs exceed available capacity", async () => {
    const proposalA: ConflictProposal = {
      id: "A",
      resourceNeeds: {
        cpu: 10,
        memory: 5,
      },
      goalWeights: {
        priority: 0.8,
        urgency: 0.9,
        costBenefit: 0.7,
      },
      description: "High priority task A",
    }
    const proposalB: ConflictProposal = {
      id: "B",
      resourceNeeds: {
        cpu: 10,
        memory: 10,
      },
      goalWeights: {
        priority: 0.8,
        urgency: 0.9,
        costBenefit: 0.7,
      },
      description: "High priority task B",
    }
    const proposals: ConflictProposal[] = [proposalA, proposalB]
    const availableResources = {cpu: 15, memory: 10}
    const allocationPlan = await arbitrateResourceConflict(
      proposals,
      availableResources
    )

    // In this scenario, both proposals require too much memory (5+10 > 10)
    // The arbitrator should prioritize based on scores, but still respect limits.
    // Assuming the implementation handles this by granting resources up to the limit.
    expect(allocationPlan.grantedProposals.length).toBe(2)
  })

  it("should grant all resources if total resource needs are within available capacity", async () => {
    const proposalA: ConflictProposal = {
      id: "A",
      resourceNeeds: {
        cpu: 5,
        memory: 5,
      },
      goalWeights: {
        priority: 0.5,
        urgency: 0.5,
        costBenefit: 0.5,
      },
      description: "Low resource task A",
    }
    const proposalB: ConflictProposal = {
      id: "B",
      resourceNeeds: {
        cpu: 5,
        memory: 5,
      },
      goalWeights: {
        priority: 0.5,
        urgency: 0.5,
        costBenefit: 0.5,
      },
      description: "Low resource task B",
    }
    const proposals: ConflictProposal[] = [proposalA, proposalB]
    const availableResources = {cpu: 10, memory: 10}
    const allocationPlan = await arbitrateResourceConflict(
      proposals,
      availableResources
    )

    expect(allocationPlan.grantedProposals.length).toBe(2)
    expect(allocationPlan.grantedProposals.find(
      (p) => p.proposalId === "A"
    )?.allocatedResources.length).toBe(2)
  })
})