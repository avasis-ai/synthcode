import { EventEmitter } from "node:events"

type SourceId = string

interface SourceMetrics {
  failureCount: number
  successCount: number
  lastUpdated: number
  totalObservations: number
}

export class SourceTrustManager {
  private sourceMetrics: Map<SourceId, SourceMetrics> = new Map()
  private readonly DECAY_RATE: number = 0.05
  private readonly INITIAL_SCORE: number = 1.0

  constructor() {}

  private initializeSource(sourceId: SourceId): void {
    if (!this.sourceMetrics.has(sourceId)) {
      this.sourceMetrics.set(sourceId, {
        failureCount: 0,
        successCount: 0,
        lastUpdated: Date.now(),
        totalObservations: 0,
      })
    }
  }

  private getMetrics(sourceId: SourceId): SourceMetrics {
    this.initializeSource(sourceId)
    return this.sourceMetrics.get(sourceId)!
  }

  private calculateTrustScore(metrics: SourceMetrics): number {
    const now = Date.now()
    const timeElapsedSeconds = (now - metrics.lastUpdated) / 1000
    
    // 1. Time Decay: Score decays exponentially based on time elapsed
    // Decay factor: e^(-DECAY_RATE * timeElapsed)
    const decayFactor = Math.exp(-this.DECAY_RATE * timeElapsedSeconds)

    // 2. Performance Weight: Ratio of successes to total observations
    let performanceWeight: number
    if (metrics.totalObservations === 0) {
      performanceWeight = 1.0
    } else {
      // A simple ratio: (Successes + 1) / (Failures + 1) * (Total Observations / 2)
      // This ensures that even zero successes/failures don't immediately tank the score,
      // but heavily penalizes failures.
      performanceWeight = (metrics.successCount + 1) / (metrics.failureCount + 1)
    }

    // 3. Combine: Initial Score * Decay * Performance Weight
    // We normalize the initial score by the total observations to prevent massive scores from single sources.
    const normalizedInitialScore = Math.min(1.0, metrics.successCount / Math.max(1, metrics.totalObservations))

    return Math.max(0.0, normalizedInitialScore * decayFactor * performanceWeight)
  }

  recordSuccess(sourceId: SourceId): void {
    const metrics = this.getMetrics(sourceId)
    metrics.successCount += 1
    metrics.totalObservations += 1
    metrics.lastUpdated = Date.now()
    this.sourceMetrics.set(sourceId, metrics)
  }

  recordFailure(sourceId: SourceId): void {
    const metrics = this.getMetrics(sourceId)
    metrics.failureCount += 1
    metrics.totalObservations += 1
    metrics.lastUpdated = Date.now()
    this.sourceMetrics.set(sourceId, metrics)
  }

  getTrustScore(sourceId: SourceId): number {
    const metrics = this.getMetrics(sourceId)
    return this.calculateTrustScore(metrics)
  }

  /**
   * Clears all metrics for a given source ID.
   * @param sourceId The ID of the source to reset.
   */
  resetSource(sourceId: SourceId): void {
    this.sourceMetrics.delete(sourceId)
  }
}

export { SourceTrustManager }