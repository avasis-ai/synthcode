import { describe, it, expect } from "vitest"
import { ServiceLevelObjectiveMonitor, SLO, MetricRecord } from "../src/monitoring/service-level-objective-monitor"

describe("ServiceLevelObjectiveMonitor", () => {
  it("should correctly update metric history and check SLOs when success rate drops", () => {
    const slo: SLO[] = [
      {
        metricName: "success_rate",
        threshold: 0.9,
        windowSizeMs: 1000,
        action: "throttle",
      },
    ]
    const monitor = new ServiceLevelObjectiveMonitor(slo)

    // Simulate successful records
    monitor.recordMetric(
      { timestamp: 100, isSuccess: true, latencyMs: 50 }
    )
    monitor.recordMetric(
      { timestamp: 200, isSuccess: true, latencyMs: 60 }
    )

    // Simulate a failure that drops the success rate below 0.9
    monitor.recordMetric(
      { timestamp: 300, isSuccess: false, latencyMs: 100 }
    )
    monitor.recordMetric(
      { timestamp: 400, isSuccess: false, latencyMs: 150 }
    )

    // Check if the monitor detects the violation and returns the correct action
    const violation = monitor.checkSLOs()
    expect(violation).toEqual({
      slo: slo[0],
      isViolated: true,
      action: "throttle",
    })
  })

  it("should not violate SLOs if the success rate remains high", () => {
    const slo: SLO[] = [
      {
        metricName: "success_rate",
        threshold: 0.9,
        windowSizeMs: 1000,
        action: "throttle",
      },
    ]
    const monitor = new ServiceLevelObjectiveMonitor(slo)

    // Simulate successful records
    monitor.recordMetric(
      { timestamp: 100, isSuccess: true, latencyMs: 50 }
    )
    monitor.recordMetric(
      { timestamp: 200, isSuccess: true, latencyMs: 60 }
    )
    monitor.recordMetric(
      { timestamp: 300, isSuccess: true, latencyMs: 70 }
    )

    // Check if the monitor detects no violation
    const violation = monitor.checkSLOs()
    expect(violation).toEqual({
      slo: slo[0],
      isViolated: false,
      action: "throttle",
    })
  })

  it("should handle multiple SLOs and check the first violation found", () => {
    const slo: SLO[] = [
      {
        metricName: "success_rate",
        threshold: 0.9,
        windowSizeMs: 1000,
        action: "throttle",
      },
      {
        metricName: "latency",
        threshold: 100,
        windowSizeMs: 1000,
        action: "escalate",
      },
    ]
    const monitor = new ServiceLevelObjectiveMonitor(slo)

    // Simulate a failure that violates success rate (0.5/2)
    monitor.recordMetric(
      { timestamp: 100, isSuccess: false, latencyMs: 50 }
    )
    monitor.recordMetric(
      { timestamp: 200, isSuccess: false, latencyMs: 150 }
    )
    monitor.recordMetric(
      { timestamp: 300, isSuccess: true, latencyMs: 80 }
    )

    // Check if the monitor detects the violation for the first SLO (success_rate)
    const violation = monitor.checkSLOs()
    expect(violation).toEqual({
      slo: slo[0],
      isViolated: true,
      action: "throttle",
    })
  })
})