import { describe, it, expect, vi } from "vitest"
import { ServiceHealthCoordinator } from "../src/observability/service-health-coordinator"

describe("ServiceHealthCoordinator", () => {
  it("should calculate overall status correctly when all services are healthy", async () => {
    const mockMetrics = [
      { sourceId: "serviceA", metricName: "latency", value: 100, timestamp: Date.now() },
      { sourceId: "serviceB", metricName: "errorRate", value: 0.01, timestamp: Date.now() },
    ]
    const coordinator = new ServiceHealthCoordinator(mockMetrics)
    const report = await coordinator.generateReport()
    expect(report.overallStatus).toBe("healthy")
    expect(report.details.length).toBe(2)
  })

  it("should report degraded status when some services are warning but none are critical", async () => {
    const mockMetrics = [
      { sourceId: "serviceA", metricName: "latency", value: 150, timestamp: Date.now() }, // Warning
      { sourceId: "serviceB", metricName: "errorRate", value: 0.05, timestamp: Date.now() }, // Warning
    ]
    const coordinator = new ServiceHealthCoordinator(mockMetrics)
    const report = await coordinator.generateReport()
    expect(report.overallStatus).toBe("degraded")
  })

  it("should report critical status if at least one service is critical", async () => {
    const mockMetrics = [
      { sourceId: "serviceA", metricName: "latency", value: 50, timestamp: Date.now() }, // Healthy
      { sourceId: "serviceB", metricName: "errorRate", value: 0.2, timestamp: Date.now() }, // Critical
    ]
    const coordinator = new ServiceHealthCoordinator(mockMetrics)
    const report = await coordinator.generateReport()
    expect(report.overallStatus).toBe("critical")
  })
})