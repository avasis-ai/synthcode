import { describe, it, expect } from "vitest"
import { ConsensusEngine, Message } from "../src/consensus/consensus-engine"

describe("ConsensusEngine", () => {
  it("should correctly calculate consensus using weighted-average strategy", async () => {
    const engine = new ConsensusEngine("weighted-average")
    const message: Message = {
      id: "msg1",
      context: "The market shows strong growth potential.",
      data: {
        sentiment: 0.8,
        risk: 0.2,
      },
    }
    const perspectiveA: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Strong growth expected.",
      confidence: 0.9,
      weight: 0.6,
      key_themes: ["growth", "potential"],
    })
    const perspectiveB: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Moderate growth, but watch risks.",
      confidence: 0.7,
      weight: 0.4,
      key_themes: ["growth", "risk"],
    })

    const results = await engine.run([perspectiveA, perspectiveB], message)

    expect(results.final_consensus).toContain("growth");
    expect(results.overall_confidence).toBeCloseTo(0.8);
    expect(results.perspectives_used).toBe(2);
  })

  it("should handle conflict summary when multiple perspectives disagree", async () => {
    const engine = new ConsensusEngine("majority-vote")
    const message: Message = {
      id: "msg2",
      context: "The project faces technical debt and market uncertainty.",
      data: {
        sentiment: 0.4,
        risk: 0.6,
      },
    }
    const perspectiveA: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Focus on technical debt resolution.",
      confidence: 0.9,
      weight: 0.8,
      key_themes: ["technical debt"],
    })
    const perspectiveB: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Market uncertainty requires immediate pivot.",
      confidence: 0.8,
      weight: 0.7,
      key_themes: ["market uncertainty", "pivot"],
    })

    const results = await engine.run([perspectiveA, perspectiveB], message)

    expect(results.conflict_summary).toContain("technical debt");
    expect(results.conflict_summary).toContain("market uncertainty");
    expect(results.final_consensus).toContain("debt");
  })

  it("should use synthesis strategy to combine key themes", async () => {
    const engine = new ConsensusEngine("synthesis")
    const message: Message = {
      id: "msg3",
      context: "The new product launch needs careful planning.",
      data: {
        sentiment: 0.6,
        risk: 0.3,
      },
    }
    const perspectiveA: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Focus on marketing and early adopters.",
      confidence: 0.8,
      weight: 0.5,
      key_themes: ["marketing", "early adopters"],
    })
    const perspectiveB: (context: Message) => Promise<PerspectiveResult> = async (context) => ({
      analysis: "Prioritize backend stability and scalability.",
      confidence: 0.9,
      weight: 0.5,
      key_themes: ["backend stability", "scalability"],
    })

    const results = await engine.run([perspectiveA, perspectiveB], message)

    expect(results.final_consensus).toContain("planning");
    expect(results.overall_confidence).toBeGreaterThan(0.7);
    expect(results.conflict_summary).toContain("marketing");
    expect(results.conflict_summary).toContain("backend stability");
  })
})