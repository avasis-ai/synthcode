import { describe, it, expect } from "vitest"
import { AgentNegotiator, Proposal, NegotiationMessage } from "../src/negotiation/agent-negotiator"

describe("AgentNegotiator", () => {
    it("should initialize with PENDING state and empty proposals", () => {
        const negotiator = new AgentNegotiator()
        expect(negotiator.getState()).toBe("PENDING")
        expect(negotiator.getProposalsSize()).toBe(0)
    })

    it("should accept a new proposal and update internal state", () => {
        const negotiator = new AgentNegotiator()
        const proposal: Proposal = {
            agentId: "agentA",
            goal: "Maximize profit",
            steps: ["Step 1", "Step 2"],
            confidenceScore: 0.8
        }
        negotiator.receiveProposal(proposal)
        expect(negotiator.getProposalsSize()).toBe(1)
        expect(negotiator.getProposals()[proposal.agentId]).toEqual(proposal)
    })

    it("should process a message and update state based on conflict or consensus", () => {
        const negotiator = new AgentNegotiator()
        const proposalA: Proposal = {
            agentId: "agentA",
            goal: "Goal A",
            steps: ["Step 1"],
            confidenceScore: 0.9
        }
        const proposalB: Proposal = {
            agentId: "agentB",
            goal: "Goal B",
            steps: ["Step 2"],
            confidenceScore: 0.7
        }
        negotiator.receiveProposal(proposalA)
        negotiator.receiveProposal(proposalB)

        // Simulate a conflict message
        const conflictMessage: NegotiationMessage = {
            senderId: "agentC",
            state: "CONFLICT",
            message: "Conflict detected",
            votes: {
                "agentA": true,
                "agentB": false
            }
        }
        negotiator.receiveMessage(conflictMessage)
        expect(negotiator.getState()).toBe("CONFLICT")
    })
})