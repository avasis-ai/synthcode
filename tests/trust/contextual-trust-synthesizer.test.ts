import { describe, it, expect } from "vitest"
import { ContextualTrustSynthesizer, SourceMetadata, TrustReport } from "../src/trust/contextual-trust-synthesizer"

describe("ContextualTrustSynthesizer", () => {
  it("should synthesize a high trust score when multiple sources agree and are authoritative", () => {
    const synthesizer = new ContextualTrustSynthesizer()
    const metadata1: SourceMetadata = {
      sourceId: "sourceA",
      authority: 10,
      timestamp: Date.now() - 1000,
      content: "The sky is blue."
    }
    const metadata2: SourceMetadata = {
      sourceId: "sourceB",
      authority: 8,
      timestamp: Date.now() - 500,
      content: "The sky is blue."
    }
    const metadata3: SourceMetadata = {
      sourceId: "sourceC",
      authority: 5,
      timestamp: Date.now(),
      content: "The sky is blue."
    }

    const report: TrustReport = synthesizer.synthesizeTrust(
      [metadata1, metadata2, metadata3],
      "The sky is blue."
    )

    expect(report.finalScore).toBeGreaterThan(20)
    expect(report.isTrustworthy).toBe(true)
    expect(report.supportingEvidence.length).toBe(3)
    expect(report.supportingEvidence.every(e => e.reason.includes("agreement"))).toBe(true)
  })

  it("should synthesize a low trust score when sources conflict", () => {
    const synthesizer = new ContextualTrustSynthesizer()
    const metadata1: SourceMetadata = {
      sourceId: "sourceA",
      authority: 10,
      timestamp: Date.now() - 1000,
      content: "The sky is blue."
    }
    const metadata2: SourceMetadata = {
      sourceId: "sourceB",
      authority: 8,
      timestamp: Date.now() - 500,
      content: "The sky is red."
    }
    const metadata3: SourceMetadata = {
      sourceId: "sourceC",
      authority: 5,
      timestamp: Date.now(),
      content: "The sky is blue."
    }

    const report: TrustReport = synthesizer.synthesizeTrust(
      [metadata1, metadata2, metadata3],
      "The sky is blue."
    )

    expect(report.finalScore).toBeLessThan(15)
    expect(report.isTrustworthy).toBe(false)
    expect(report.conflictDetails.length).toBeGreaterThan(0)
    expect(report.conflictDetails.some(d => d.includes("conflict"))).toBe(true)
  })

  it("should handle empty input gracefully", () => {
    const synthesizer = new ContextualTrustSynthesizer()
    const report: TrustReport = synthesizer.synthesizeTrust(
      [],
      "Some statement"
    )

    expect(report.finalScore).toBe(0)
    expect(report.isTrustworthy).toBe(false)
    expect(report.supportingEvidence).toEqual([])
    expect(report.conflictDetails).toEqual([])
  })
})