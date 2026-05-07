import { describe, it, expect } from "vitest"
import { CapabilityDriftDetector, CapabilityMetrics, Baseline } from "../../../src/drift/capability-drift-detector.js"

describe("CapabilityDriftDetector", () => {
  it("should detect drift when average latency significantly increases", () => {
    const detector = new CapabilityDriftDetector(
      {
        averageLatencyMs: 100,
        stdDevLatencyMs: 20,
        averageSuccessRate: 0.9,
        stdDevSuccessRate: 0.1,
        averageResourceUsageBytes: 500,
      },
      2.0
    )
    const metrics = {
      totalInvocations: 100,
      averageLatencyMs: 150,
      successRate: 0.9,
      averageResourceUsageBytes: 500,
    }
    const drift = detector.check(metrics)
    expect(drift.isDrifting).toBe(true)
    expect(drift.reason).toContain("latency")
  })

  it("should not detect drift when metrics are within acceptable bounds", () => {
    const detector = new CapabilityDriftDetector(
      {
        averageLatencyMs: 100,
        stdDevLatencyMs: 20,
        averageSuccessRate: 0.9,
        stdDevSuccessRate: 0.1,
        averageResourceUsageBytes: 500,
      },
      2.0
    )
    const metrics = {
      totalInvocations: 100,
      averageLatencyMs: 105,
      successRate: 0.91,
      averageResourceUsageBytes: 510,
    }
    const drift = detector.check(metrics)
    expect(drift.isDrifting).toBe(false)
  })

  it("should detect drift when success rate significantly drops", () => {
    const detector = new CapabilityDriftDetector(
      {
        averageLatencyMs: 100,
        stdDevLatencyMs: 20,
        averageSuccessRate: 0.9,
        stdDevSuccessRate: 0.1,
        averageResourceUsageBytes: 500,
      },
      2.0
    )
    const metrics = {
      totalInvocations: 100,
      averageLatencyMs: 100,
      successRate: 0.7,
      averageResourceUsageBytes: 500,
    }
    const drift = detector.check(metrics)
    expect(drift.isDrifting).toBe(true)
    expect(drift.reason).toContain("success rate")
  })
})