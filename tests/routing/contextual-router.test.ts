import { describe, it, expect } from "vitest"
import { ContextualRouter, RouteCandidate } from "../src/routing/contextual-router.js"

describe("ContextualRouter", () => {
  it("should calculate a combined score based on relevance, utility, and cost", () => {
    const router = new ContextualRouter()
    const context: Message[] = [
      { type: "UserMessage", content: "What is the capital of France?" }
    ]
    const candidate: RouteCandidate = {
      actionName: "get_location",
      actionPayload: { country: "France" },
      relevanceScore: 0.8,
      utilityWeight: 0.5,
      costEstimate: 0.1
    }
    const combinedScore = router.calculateScore(context, candidate)
    // Expected score calculation: relevance * utility - cost
    expect(combinedScore).toBeCloseTo(0.8 * 0.5 - 0.1)
  })

  it("should handle different candidates and select the highest scoring one", () => {
    const router = new ContextualRouter()
    const context: Message[] = [
      { type: "UserMessage", content: "I need help with my car." }
    ]
    const candidateA: RouteCandidate = {
      actionName: "book_appointment",
      actionPayload: {},
      relevanceScore: 0.9,
      utilityWeight: 0.8,
      costEstimate: 0.2
    }
    const candidateB: RouteCandidate = {
      actionName: "check_weather",
      actionPayload: {},
      relevanceScore: 0.5,
      utilityWeight: 0.1,
      costEstimate: 0.05
    }
    const candidateC: RouteCandidate = {
      actionName: "get_directions",
      actionPayload: {},
      relevanceScore: 0.7,
      utilityWeight: 0.5,
      costEstimate: 0.1
    }

    // Score A: 0.9 * 0.8 - 0.2 = 0.72 - 0.2 = 0.52
    // Score B: 0.5 * 0.1 - 0.05 = 0.05 - 0.05 = 0
    // Score C: 0.7 * 0.5 - 0.1 = 0.35 - 0.1 = 0.25
    const candidates: RouteCandidate[] = [candidateA, candidateB, candidateC]
    const bestCandidate = router.selectBestCandidate(context, candidates)

    expect(bestCandidate.actionName).toBe("book_appointment")
    expect(bestCandidate.relevanceScore).toBe(0.9)
  })

  it("should return null if no candidates are provided", () => {
    const router = new ContextualRouter()
    const context: Message[] = []
    const candidates: RouteCandidate[] = []
    const bestCandidate = router.selectBestCandidate(context, candidates)

    expect(bestCandidate).toBeNull()
  })
})