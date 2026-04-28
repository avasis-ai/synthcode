import { describe, it, expect } from "vitest";
import { DecayScheduler, DecayParameters } from "../src/context/semantic-context-decay-scheduler";

describe("DecayScheduler", () => {
  it("should calculate decay scores correctly based on parameters", () => {
    const params: DecayParameters = {
      initialDecayRate: 0.1,
      recencyWeight: 0.5,
      interactionFrequencyWeight: 0.3,
      threshold: 0.1,
    };
    const scheduler = new DecayScheduler(null!, params);
    const initialScore = 1.0;
    const timeElapsed = 100;
    const interactionCount = 5;

    // Simulate decay calculation (assuming a simplified model for testing)
    // The actual calculation depends on the internal logic, but we test the concept.
    // We expect the score to decrease based on time and interaction.
    const decayedScore = scheduler.calculateDecayScore(initialScore, timeElapsed, interactionCount);

    // Assert that the score is less than the initial score and above zero (if parameters are reasonable)
    expect(decayedScore).toBeLessThan(initialScore);
    expect(decayedScore).toBeGreaterThanOrEqual(0);
  });

  it("should correctly identify contexts for pruning when score falls below threshold", () => {
    const params: DecayParameters = {
      initialDecayRate: 0.1,
      recencyWeight: 0.5,
      interactionFrequencyWeight: 0.3,
      threshold: 0.2,
    };
    const scheduler = new DecayScheduler(null!, params);

    // Mock a context that is very old and rarely interacted with
    const mockContext = {
      id: "old_context",
      score: 0.15, // Below threshold
      lastAccessed: Date.now() - 100000,
      interactionCount: 1,
    };

    // Mock a context that is recent and highly interacted with
    const mockActiveContext = {
      id: "active_context",
      score: 0.9, // Above threshold
      lastAccessed: Date.now(),
      interactionCount: 10,
    };

    // We need to mock the internal mechanism that uses the threshold.
    // Since we can't easily mock the internal state/store interaction here,
    // we test the method that *should* return prune candidates.
    const pruneCandidates = scheduler.getPruneCandidates([mockContext, mockActiveContext]);

    // Expect the old context to be marked for pruning, and the active one to be kept.
    expect(pruneCandidates).toHaveLength(1);
    expect(pruneCandidates[0].contextId).toBe("old_context");
  });

  it("should return an empty array when all contexts are above the decay threshold", () => {
    const params: DecayParameters = {
      initialDecayRate: 0.1,
      recencyWeight: 0.5,
      interactionFrequencyWeight: 0.3,
      threshold: 0.1,
    };
    const scheduler = new DecayScheduler(null!, params);

    // Mock contexts that are all sufficiently active
    const mockContexts = [
      { id: "c1", score: 0.8, lastAccessed: Date.now(), interactionCount: 5 },
      { id: "c2", score: 0.5, lastAccessed: Date.now() - 1000, interactionCount: 2 },
    ];

    const pruneCandidates = scheduler.getPruneCandidates(mockContexts);

    // Expect no contexts to be marked for pruning
    expect(pruneCandidates).toHaveLength(0);
  });
});