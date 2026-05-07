import { describe, it, expect } from "vitest"
import { EvidencePayload, ConflictReport } from "../src/evidence/evidence-triangulation-service"
import { triangulateEvidence } from "../src/evidence/evidence-triangulation-service"

describe("triangulateEvidence", () => {
  it("should generate a conflict report when evidence sources contradict each other", async () => {
    const evidence1: EvidencePayload = {
      claim: "The meeting was held on Monday.",
      sourceAuthorityScore: 0.9,
      recencyScore: 0.8,
      evidenceText: "According to the minutes, the meeting was on Monday.",
      sourceMetadata: { source: "Minutes" },
    }
    const evidence2: EvidencePayload = {
      claim: "The meeting was held on Tuesday.",
      sourceAuthorityScore: 0.7,
      recencyScore: 0.9,
      evidenceText: "Email chain confirms the meeting was on Tuesday.",
      sourceMetadata: { source: "Email" },
    }
    const evidence3: EvidencePayload = {
      claim: "The meeting was held on Monday.",
      sourceAuthorityScore: 0.6,
      recencyScore: 0.5,
      evidenceText: "A casual mention suggests Monday.",
      sourceMetadata: { source: "Chat" },
    }

    const report: ConflictReport = await triangulateEvidence([evidence1, evidence2, evidence3])

    expect(report.conflicts.length).toBeGreaterThan(0)
    expect(report.summary).toContain("conflict")
  })

  it("should generate a summary and low confidence score when evidence is conflicting but no clear winner", async () => {
    const evidence1: EvidencePayload = {
      claim: "The project deadline is next week.",
      sourceAuthorityScore: 0.8,
      recencyScore: 0.9,
      evidenceText: "Manager said it's next week.",
      sourceMetadata: { source: "Manager" },
    }
    const evidence2: EvidencePayload = {
      claim: "The project deadline is in two weeks.",
      sourceAuthorityScore: 0.7,
      recencyScore: 0.8,
      evidenceText: "Team calendar shows two weeks.",
      sourceMetadata: { source: "Calendar" },
    }

    const report: ConflictReport = await triangulateEvidence([evidence1, evidence2])

    expect(report.conflicts.length).toBe(1)
    expect(report.summary).toContain("disagreement")
    expect(report.summary).toContain("low confidence")
  })

  it("should generate a high confidence score and synthesized truth when evidence is consistent", async () => {
    const evidence1: EvidencePayload = {
      claim: "The meeting was held on Monday.",
      sourceAuthorityScore: 0.9,
      recencyScore: 0.9,
      evidenceText: "Official minutes confirm Monday.",
      sourceMetadata: { source: "Minutes" },
    }
    const evidence2: EvidencePayload = {
      claim: "The meeting was held on Monday.",
      sourceAuthorityScore: 0.8,
      recencyScore: 0.8,
      evidenceText: "Multiple sources confirm Monday.",
      sourceMetadata: { source: "Email" },
    }

    const report: ConflictReport = await triangulateEvidence([evidence1, evidence2])

    expect(report.conflicts.length).toBe(0)
    expect(report.summary).toContain("synthesized truth")
    expect(report.summary).toContain("high confidence")
  })
})