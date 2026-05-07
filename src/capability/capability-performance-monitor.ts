import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types";

interface Observation {
    timestamp: number;
    success: boolean;
    latencyMs: number;
    errorDetails?: string;
}

interface ToolMetrics {
    totalObservations: number;
    successfulObservations: number;
    failedObservations: number;
    totalLatencyMs: number;
    observations: Observation[];
}

export class CapabilityPerformanceMonitor {
    private metrics: Map<string, ToolMetrics>;
    private readonly WINDOW_SIZE: number;

    constructor(windowSize: number = 100) {
        this.metrics = new Map<string, ToolMetrics>();
        this.WINDOW_SIZE = windowSize;
    }

    private getOrCreateMetrics(toolId: string): ToolMetrics {
        if (!this.metrics.has(toolId)) {
            this.metrics.set(toolId, {
                totalObservations: 0,
                successfulObservations: 0,
                failedObservations: 0,
                totalLatencyMs: 0,
                observations: []
            });
        }
        return this.metrics.get(toolId)!;
    }

    recordObservation(toolId: string, success: boolean, latencyMs: number, errorDetails?: string): void {
        const metrics = this.getOrCreateMetrics(toolId);
        const observation: Observation = {
            timestamp: Date.now(),
            success: success,
            latencyMs: latencyMs,
            errorDetails: errorDetails
        };

        // Update running totals
        metrics.totalObservations += 1;
        metrics.totalLatencyMs += latencyMs;
        if (success) {
            metrics.successfulObservations += 1;
        } else {
            metrics.failedObservations += 1;
        }

        // Maintain sliding window
        metrics.observations.push(observation);
        if (metrics.observations.length > this.WINDOW_SIZE) {
            metrics.observations.shift();
        }
    }

    private calculateMovingAverage(toolId: string): {
        errorRate: number;
        avgLatencyMs: number;
    } {
        const metrics = this.metrics.get(toolId);
        if (!metrics || metrics.observations.length === 0) {
            return { errorRate: 0, avgLatencyMs: 0 };
        }

        const window = metrics.observations;
        const windowSize = window.length;
        let totalErrors = 0;
        let totalLatency = 0;

        for (const obs of window) {
            if (!obs.success) {
                totalErrors += 1;
            }
            totalLatency += obs.latencyMs;
        }

        const errorRate = totalErrors / windowSize;
        const avgLatencyMs = totalLatency / windowSize;

        return { errorRate, avgLatencyMs };
    }

    getHealthScore(toolId: string): number {
        const { errorRate, avgLatencyMs } = this.calculateMovingAverage(toolId);

        // Health Score calculation: Prioritizes low error rate and low latency.
        // Weighting: Error Rate (high penalty), Latency (moderate penalty).
        // Score = 1 - (Weight_Error * ErrorRate + Weight_Latency * NormalizedLatency)
        
        // Normalize latency (assuming max acceptable latency is 500ms for scoring purposes)
        const normalizedLatency = Math.min(1, avgLatencyMs / 500);

        // Simple scoring: 1.0 (perfect) down to 0.0 (failure)
        const healthScore = 1.0 - (errorRate * 2.0 + normalizedLatency * 0.5);
        return Math.max(0.0, healthScore);
    }

    getReliabilityScore(toolId: string): number {
        const metrics = this.metrics.get(toolId);
        if (!metrics || metrics.totalObservations === 0) {
            return 0.0;
        }

        // Reliability is purely based on success rate over the window
        const window = metrics.observations;
        if (window.length === 0) {
            return 0.0;
        }

        let successfulCount = 0;
        for (const obs of window) {
            if (obs.success) {
                successfulCount += 1;
            }
        }

        return successfulCount / window.length;
    }
}