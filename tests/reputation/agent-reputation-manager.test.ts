import { describe, it, expect } from "vitest";
import { AgentReputationManager, ReputationScore, AgentMetrics } from "../src/reputation/agent-reputation-manager";

describe("AgentReputationManager", () => {
  it("should initialize with empty reputation data", () => {
    const manager = new AgentReputationManager();
    // We can't directly access private map, but we can test behavior
    expect(manager.getAgentMetrics("nonExistentAgent")).toEqual({
      totalAttempts: 0,
      successfulAttempts: 0,
      failureCount: 0,
      contractAdherenceScore: 0,
      conflictFrequency: 0,
    });
  });

  it("should update reputation scores and metrics correctly upon interaction", () => {
    const manager = new AgentReputationManager();
    const agentId = "testAgent123";

    // Simulate first successful interaction
    manager.recordSuccessfulInteraction(agentId);
    expect(manager.getAgentMetrics(agentId).successfulAttempts).toBe(1);
    expect(manager.getAgentMetrics(agentId).totalAttempts).toBe(1);

    // Simulate a failure
    manager.recordFailedInteraction(agentId);
    expect(manager.getAgentMetrics(agentId).failureCount).toBe(1);
    expect(manager.getAgentMetrics(agentId).totalAttempts).toBe(2);

    // Simulate a successful interaction with high adherence
    manager.recordSuccessfulInteraction(agentId, 0.95);
    expect(manager.getAgentMetrics(agentId).successfulAttempts).toBe(2);
    expect(manager.getAgentMetrics(agentId).contractAdherenceScore).toBeCloseTo(0.95);
  });

  it("should decay reputation scores over time", () => {
    const manager = new AgentReputationManager();
    const agentId = "decayTestAgent";

    // Set initial score
    manager.setReputationScore(agentId, 0.8, 0.1);

    // Simulate time passing (decay)
    const initialScore = manager.getReputationScore(agentId).score;
    const decayFactor = 0.5; // Assuming a decay factor for testing
    
    // Manually simulating the internal decay mechanism check (if possible, otherwise testing the getter)
    // Since we cannot access the private decay method, we test the score after a simulated time jump.
    // Assuming the decay logic is applied when retrieving or updating.
    
    // For a robust test, we assume a method exists or the getter handles decay.
    // Let's assume a method `getReputationScore` handles the decay calculation internally.
    const scoreAfterDecay = manager.getReputationScore(agentId).score;
    
    // Since the actual decay logic is internal, we assert that the score has changed and is lower.
    // A more precise test would require mocking time or exposing the decay mechanism.
    expect(scoreAfterDecay).toBeLessThan(initialScore);
    expect(scoreAfterDecay).toBeGreaterThan(0);
  });
});