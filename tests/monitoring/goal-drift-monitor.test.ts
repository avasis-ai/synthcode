import { describe, it, expect } from "vitest";
import { AgentGoalDriftMonitor } from "../src/monitoring/goal-drift-monitor";

describe("AgentGoalDriftMonitor", () => {
  it("should calculate a high score when the conversation strongly adheres to the goal", () => {
    const monitor = new AgentGoalDriftMonitor();
    const goalAdherentMessages = [
      { type: "user", content: "Can you help me plan a trip to Paris?" },
      { type: "assistant", content: "I can certainly help with Paris travel plans. What dates are you considering?" },
      { type: "user", content: "From October 10th to October 15th." },
    ];
    // Mocking internal logic to ensure a high score for simplicity in the test structure
    // In a real scenario, we might mock dependencies or use a controlled environment.
    // For this test, we assume a perfect adherence results in a high score.
    const report = monitor.generateReport(goalAdherentMessages, "Plan a trip to Paris.");
    expect(report.score).toBeGreaterThan(0.8);
    expect(report.severity).toBe("Low");
  });

  it("should calculate a low score and high severity when the conversation drifts significantly", () => {
    const monitor = new AgentGoalDriftMonitor();
    const driftedMessages = [
      { type: "user", content: "I need help planning a trip to Paris." },
      { type: "assistant", content: "Paris sounds lovely! Let's look at hotels." },
      { type: "user", content: "Actually, can you also tell me about the best investment strategies for stocks?" }, // Topic shift
      { type: "assistant", content: "Stock market analysis is complex. Let's pivot to finance." }, // Further drift
    ];
    const report = monitor.generateReport(driftedMessages, "Plan a trip to Paris.");
    expect(report.score).toBeLessThan(0.4);
    expect(report.severity).toBe("High");
    expect(report.driftPoints).toContain("Topic shift detected: From travel to finance.");
  });

  it("should return a moderate score when the conversation touches on the goal but introduces minor tangents", () => {
    const monitor = new AgentGoalDriftMonitor();
    const mixedMessages = [
      { type: "user", content: "I'm planning a trip to Paris. What's the best way to get there?" },
      { type: "assistant", content: "The train is efficient. Also, did you know the Eiffel Tower was built for the 1889 World's Fair?" }, // Minor tangent
      { type: "user", content: "Yes, that's interesting, but back to the itinerary..." },
    ];
    const report = monitor.generateReport(mixedMessages, "Plan a trip to Paris.");
    expect(report.score).toBeGreaterThanOrEqual(0.4);
    expect(report.score).toBeLessThan(0.8);
    expect(report.severity).toBe("Medium");
  });
});