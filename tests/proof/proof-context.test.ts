import { describe, it, expect } from "vitest"
import { ProofContext, Evidence, Justification } from "../src/proof/proof-context"

describe("ProofContext", () => {
    it("should initialize with empty evidence and justification chains", () => {
        const context = new ProofContext()
        expect(context.getEvidenceChain()).toEqual([])
        expect(context.getJustificationChain()).toEqual([])
    })

    it("should add evidence and justification correctly", () => {
        const context = new ProofContext()
        const evidence1: Evidence = {
            source: "sourceA",
            type: "observation",
            confidence: 0.9,
            payload: { value: 10 },
            timestamp: Date.now()
        }
        const justification1: Justification = {
            description: "Initial observation",
            relatedEvidenceIds: [],
            weight: 0.5,
            timestamp: Date.now()
        }

        context.addEvidence(evidence1)
        context.addJustification(justification1)

        expect(context.getEvidenceChain()).toHaveLength(1)
        expect(context.getEvidenceChain()[0]).toEqual(evidence1)

        expect(context.getJustificationChain()).toHaveLength(1)
        expect(context.getJustificationChain()[0]).toEqual(justification1)
    })

    it("should maintain chronological order of evidence and justifications", () => {
        const context = new ProofContext()
        const evidence1: Evidence = {
            source: "sourceA",
            type: "observation",
            confidence: 0.9,
            payload: { value: 10 },
            timestamp: 1000
        }
        const evidence2: Evidence = {
            source: "sourceB",
            type: "calculation",
            confidence: 0.8,
            payload: { value: 20 },
            timestamp: 2000
        }
        const justification1: Justification = {
            description: "Step 1",
            relatedEvidenceIds: [],
            weight: 0.5,
            timestamp: 1500
        }

        context.addEvidence(evidence1)
        context.addJustification(justification1)
        context.addEvidence(evidence2)

        const evidenceChain = context.getEvidenceChain()
        const justificationChain = context.getJustificationChain()

        expect(evidenceChain).toHaveLength(2)
        expect(evidenceChain[0]).toEqual(evidence1)
        expect(evidenceChain[1]).toEqual(evidence2)

        expect(justificationChain).toHaveLength(1)
        expect(justificationChain[0]).toEqual(justification1)
    })
})