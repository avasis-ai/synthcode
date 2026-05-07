import { describe, it, expect } from "vitest";
import { DriftMonitor } from "../src/drift/contextual-drift-mitigation-engine";

describe("DriftMonitor", () => {
  it("should detect high drift when intent consistency is low and resource usage deviates significantly", async () => {
    const monitor = new DriftMonitor();
    const currentContext: Message = {
      role: "user",
      content: {
        blocks: [
          { type: "text", content: "What are the key features of quantum computing?" }
        ]
      }
    };
    const metrics: ContextMetrics = {
      intentConsistencyScore: 0.1,
      resourceUsagePatternDeviation: 0.9,
      knowledgeGraphCoherenceScore: 0.5,
    };

    const report = await monitor.analyze(currentContext, metrics);

    expect(report.isDriftDetected).toBe(true);
    expect(report.severity).toBe("high");
    expect(report.recommendedAction).toContain("re-orient");
    expect(report.suggestedContextUpdate).not.toBeNull();
  });

  it("should recommend low severity action when only knowledge graph coherence is slightly off", async () => {
    const monitor = new DriftMonitor();
    const currentContext: Message = {
      role: "user",
        content: {
        blocks: [
          { type: "text", content: "Can you elaborate on the history of AI?" }
        ]
      }
    };
    const metrics: ContextMetrics = {
      intentConsistencyScore: 0.9,
      resourceUsagePatternDeviation: 0.2,
      knowledgeGraphCoherenceScore: 0.6,
    };

    const report = await monitor.analyze(currentContext, metrics);

    expect(report.isDriftDetected).toBe(true);
    expect(report.severity).toBe("low");
    expect(report.recommendedAction).toContain("clarify");
    expect(report.suggestedContextUpdate).not.toBeNull();
  });

  it("should report no drift when all context metrics are high and stable", async () => {
    const monitor = new DriftMonitor();
    const currentContext: Message = {
      role: "assistant",
      content: {
        blocks: [
          { type: "text", content: "Based on your previous query, here are the details." }
        ]
      }
    };
    const metrics: ContextMetrics = {
      intentConsistencyScore: 0.95,
      resourceUsagePatternDeviation: 0.1,
      knowledgeGraphCoherenceScore: 0.9,
    };

    const report = await monitor.analyze(currentContext, metrics);

    expect(report.isDriftDetected).toBe(false);
    expect(report.severity).toBe("low");
    expect(report.recommendedAction).toBe("maintain");
    expect(report.suggestedContextUpdate).toBeNull();
  });
});