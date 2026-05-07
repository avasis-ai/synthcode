import { describe, it, expect } from "vitest"
import { ServiceSLAProfiler, ServiceMetrics, SLOs } from "../src/profiling/service-sla-profiler.js"

describe("ServiceSLAProfiler", () => {
  it("should initialize state correctly", () => {
    const slo: SLOs = {
      max_latency_ms: 100,
      max_error_rate: 0.05,
      min_throughput_rps: 5,
    }
    const profiler = new ServiceSLAProfiler(slo, 0.2)
    expect(profiler.getState()).toEqual({
      metricsHistory: [],
      ewmaLatency: 0,
      ewmaErrorRate: 0,
      ewmaThroughput: 0,
    })
  })

  it("should update EWMA metrics and check SLA compliance on new metrics", () => {
    const slo: SLOs = {
      max_latency_ms: 100,
      max_error_rate: 0.05,
      min_throughput_rps: 5,
    }
    const profiler = new ServiceSLAProfiler(slo, 0.2)
    const metrics: ServiceMetrics = {
      timestamp: Date.now(),
      latency_ms: 50,
      error_rate: 0.01,
      throughput_rps: 10,
    }

    profiler.processMetrics(metrics)

    const state = profiler.getState()
    expect(state.metricsHistory).toHaveLength(1)
    expect(state.ewmaLatency).toBeCloseTo(50, 2)
    expect(state.ewmaErrorRate).toBeCloseTo(0.01, 2)
    expect(state.ewmaThroughput).toBeCloseTo(10, 2)

    expect(profiler.isSlaCompliant(metrics)).toBe(true)
  })

  it("should detect SLA violation when latency exceeds threshold", () => {
    const slo: SLOs = {
      max_latency_ms: 100,
      max_error_rate: 0.05,
      min_throughput_rps: 5,
    }
    const profiler = new ServiceSLAProfiler(slo, 0.2)
    const violatingMetrics: ServiceMetrics = {
      timestamp: Date.now(),
      latency_ms: 150,
      error_rate: 0.01,
      throughput_rps: 10,
    }

    profiler.processMetrics(violatingMetrics)

    expect(profiler.isSlaCompliant(violatingMetrics)).toBe(false)
  })
})