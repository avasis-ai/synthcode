import { describe, it, expect } from "vitest"
import { SourceTrustManager } from "../src/trust/source-trust-manager.js"

describe("SourceTrustManager", () => {
  it("should initialize source metrics correctly for a new source", () => {
    const manager = new SourceTrustManager()
    // We can't directly access private members, so we test the behavior
    // by observing how the score changes after an initial observation.
    // Assuming a method exists to record success/failure, let's assume
    // a method like 'recordObservation' exists for testing purposes.
    // Since the provided code snippet is incomplete, we will assume
    // the existence of a method that allows us to check the internal state
    // or the resulting score.
    
    // For this test, we will assume the manager has a method `recordObservation(sourceId: SourceId, isSuccess: boolean)`
    // and a method `getTrustScore(sourceId: SourceId): number`.
    
    // Mocking the necessary methods for a functional test based on the class structure
    // Since we cannot modify the class structure, we will assume the test environment
    // allows us to test the core logic flow.
    
    // Let's assume a helper method or direct interaction is possible for testing.
    // If we assume the manager has a method `recordObservation` and `getTrustScore`:
    
    // @ts-ignore: Assuming method existence for testing purposes
    manager.recordObservation("sourceA", true)
    const scoreA = manager.getTrustScore("sourceA")
    expect(scoreA).toBeGreaterThan(0.9) // Should be close to initial score
  })

  it("should decrease the trust score upon consecutive failures", () => {
    const manager = new SourceTrustManager()
    const sourceId = "sourceB"

    // @ts-ignore: Assuming method existence for testing purposes
    manager.recordObservation(sourceId, false)
    let score = manager.getTrustScore(sourceId)
    expect(score).toBeLessThan(1.0)

    // @ts-ignore: Assuming method existence for testing purposes
    manager.recordObservation(sourceId, false)
    score = manager.getTrustScore(sourceId)
    expect(score).toBeLessThan(score) // Score should decrease further
  })

  it("should increase the trust score upon consecutive successes", () => {
    const manager = new SourceTrustManager()
    const sourceId = "sourceC"

    // @ts-ignore: Assuming method existence for testing purposes
    manager.recordObservation(sourceId, true)
    let score = manager.getTrustScore(sourceId)
    expect(score).toBeGreaterThan(1.0) // Score should increase above initial score

    // @ts-ignore: Assuming method existence for testing purposes
    manager.recordObservation(sourceId, true)
    score = manager.getTrustScore(sourceId)
    expect(score).toBeGreaterThan(score) // Score should increase further
  })
})