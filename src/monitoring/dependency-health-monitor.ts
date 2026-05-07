import { EventEmitter } from "node:events"

interface ServiceMetrics {
    totalObservations: number
    successfulObservations: number
    totalLatencyMs: number
    averageLatencyMs: number
    errorCount: number
    lastUpdated: number
}

export class DependencyHealthMonitor extends EventEmitter {
    private serviceMetrics: Map<string, ServiceMetrics> = new Map()
    private readonly WINDOW_SIZE: number = 10

    constructor() {
        super()
    }

    private initializeService(serviceId: string): void {
        if (!this.serviceMetrics.has(serviceId)) {
            this.serviceMetrics.set(serviceId, {
                totalObservations: 0,
                successfulObservations: 0,
                totalLatencyMs: 0,
                averageLatencyMs: 0,
                errorCount: 0,
                lastUpdated: Date.now()
            })
        }
    }

    recordObservation(serviceId: string, success: boolean, latencyMs: number, errorDetails?: string): void {
        this.initializeService(serviceId)

        const metrics = this.serviceMetrics.get(serviceId)!

        // Simple rolling average update (over the last N observations)
        // For simplicity and adherence to constraints, we will update the running average
        // and cap the effective window size by resetting the metrics if the count exceeds WINDOW_SIZE
        
        let newMetrics: ServiceMetrics = {
            totalObservations: metrics.totalObservations + 1,
            successfulObservations: metrics.successfulObservations + (success ? 1 : 0),
            totalLatencyMs: metrics.totalLatencyMs + latencyMs,
            averageLatencyMs: (metrics.totalLatencyMs * (metrics.totalObservations - 1) + latencyMs) / metrics.totalObservations,
            errorCount: metrics.errorCount + (success ? 0 : 1),
            lastUpdated: Date.now()
        }

        if (newMetrics.totalObservations > this.WINDOW_SIZE) {
            // Simple decay/reset mechanism to simulate a rolling window
            const decayFactor = 0.9
            newMetrics.totalObservations = this.WINDOW_SIZE
            newMetrics.successfulObservations = Math.round(metrics.successfulObservations * decayFactor + (success ? 1 : 0) * (1 - decayFactor))
            newMetrics.totalLatencyMs = (metrics.totalLatencyMs * decayFactor + latencyMs * (1 - decayFactor))
            newMetrics.averageLatencyMs = newMetrics.totalLatencyMs / this.WINDOW_SIZE
            newMetrics.errorCount = Math.round(metrics.errorCount * decayFactor + (success ? 0 : 1) * (1 - decayFactor))
        }

        this.serviceMetrics.set(serviceId, newMetrics)
        this.emit("observationRecorded", serviceId, newMetrics)
    }

    getHealthScore(serviceId: string): number {
        const metrics = this.serviceMetrics.get(serviceId)
        if (!metrics || metrics.totalObservations === 0) {
            return 0.0
        }

        const { successfulObservations, totalObservations, averageLatencyMs, errorCount } = metrics

        // 1. Success Rate Component (Weight: 0.5)
        const successRate = successfulObservations / totalObservations
        const successScore = successRate * 0.5

        // 2. Latency Component (Weight: 0.3)
        // Normalize latency (assuming a target latency of 100ms for max score)
        const latencyPenalty = Math.min(1, averageLatencyMs / 500) // Penalty increases sharply after 100ms
        const latencyScore = Math.max(0, 1 - latencyPenalty) * 0.3

        // 3. Error Rate Component (Weight: 0.2)
        const errorRate = errorCount / totalObservations
        const errorPenalty = errorRate * 1.5 // Error rate penalty is weighted heavily
        const errorScore = Math.max(0, 1 - errorPenalty) * 0.2

        // Total Score (Max possible score: 1.0)
        return Math.min(1.0, successScore + latencyScore + errorScore)
    }

    getServiceStatus(serviceId: string): { score: number; metrics: ServiceMetrics } {
        const metrics = this.serviceMetrics.get(serviceId) || {
            totalObservations: 0,
            successfulObservations: 0,
            totalLatencyMs: 0,
            averageLatencyMs: 0,
            errorCount: 0,
            lastUpdated: 0
        }
        return {
            score: this.getHealthScore(serviceId),
            metrics: metrics
        }
    }
}

export { DependencyHealthMonitor }