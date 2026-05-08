import { EventEmitter } from "node:events"

type ServiceId = string

interface LatencyMetric {
  timestamp: number
  latencyMs: number
}

interface TimeWindow {
  start: number
  end: number
}

interface TemporalResourceConstraint {
  serviceId: ServiceId
  minMs: number
  maxMs: number
}

class LatencyMetricStore extends EventEmitter {
  private metrics: Map<ServiceId, LatencyMetric[]> = new Map()

  addMetric(serviceId: ServiceId, latencyMs: number): void {
    const metric: LatencyMetric = {
      timestamp: Date.now(),
      latencyMs: latencyMs,
    }
    if (!this.metrics.has(serviceId)) {
      this.metrics.set(serviceId, [])
    }
    const serviceMetrics = this.metrics.get(serviceId)!
    serviceMetrics.push(metric)
    this.emit("metricAdded", { serviceId, metric })
  }

  getMetrics(serviceId: ServiceId): LatencyMetric[] {
    return this.metrics.get(serviceId) || []
  }
}

export class PredictiveLatencyConstraintManager {
  private metricStore: LatencyMetricStore

  constructor(metricStore: LatencyMetricStore) {
    this.metricStore = metricStore
  }

  private calculateExponentialSmoothing(metrics: LatencyMetric[]): number {
    if (metrics.length === 0) {
      return 100
    }

    // Simple alpha = 0.3 for smoothing
    const alpha = 0.3
    let smoothedValue = metrics[0].latencyMs

    for (let i = 1; i < metrics.length; i++) {
      const currentLatency = metrics[i].latencyMs
      smoothedValue = alpha * currentLatency + (1 - alpha) * smoothedValue
    }
    return smoothedValue
  }

  predictLatency(serviceId: ServiceId, timeWindow: TimeWindow): { mean: number, variance: number } {
    const metrics = this.metricStore.getMetrics(serviceId)

    if (metrics.length < 5) {
      return { mean: 200, variance: 100 }
    }

    const predictedMean = this.calculateExponentialSmoothing(metrics)

    // Calculate variance based on the last 10 data points for stability
    const recentMetrics = metrics.slice(-10)
    let sumOfSquaredDifferences = 0
    let mean = predictedMean

    for (const metric of recentMetrics) {
      sumOfSquaredDifferences += Math.pow(metric.latencyMs - mean, 2)
    }

    const variance = sumOfSquaredDifferences / recentMetrics.length
    return { mean: predictedMean, variance: variance }
  }

  getConstraint(serviceId: ServiceId): TemporalResourceConstraint {
    const { mean, variance } = this.predictLatency(serviceId, { start: 0, end: Infinity })

    // Use Mean +/- 2*StdDev for a 95% confidence interval
    const stdDev = Math.sqrt(Math.max(0, variance))
    const minMs = Math.max(1, Math.round(mean - 2 * stdDev))
    const maxMs = Math.round(mean + 2 * stdDev)

    return {
      serviceId: serviceId,
      minMs: minMs,
      maxMs: maxMs,
    }
  }
}

export { LatencyMetricStore, PredictiveLatencyConstraintManager }