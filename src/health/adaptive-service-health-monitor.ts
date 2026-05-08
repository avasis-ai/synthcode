import { EventEmitter } from "node:events"

export interface ServiceMetric {
    latencyMs: number
    errorCount: number
    resourceUsagePercent: number
    timestamp: number
}

export interface ServiceHealthMonitorConfig {
    criticalThreshold: number
    weights: {
        latency: number
        errorRate: number
        resourceUsage: number
    }
}

export class AdaptiveServiceHealthMonitor extends EventEmitter {
    private services: Map<string, { name: string; metrics: ServiceMetric[] }> = new Map()
    private config: ServiceHealthMonitorConfig

    constructor(config: ServiceHealthMonitorConfig) {
        super()
        this.config = config
    }

    registerService(serviceName: string, initialMetrics: ServiceMetric[] = []) {
        if (this.services.has(serviceName)) {
            console.warn(`Service ${serviceName} already registered. Overwriting metrics.`)
        }
        this.services.set(serviceName, { name: serviceName, metrics: initialMetrics })
    }

    processMetrics(serviceName: string, metrics: ServiceMetric[]): void {
        if (!this.services.has(serviceName)) {
            console.error(`Attempted to process metrics for unregistered service: ${serviceName}`)
            return
        }
        const currentService = this.services.get(serviceName)!
        const updatedMetrics = [...currentService.metrics, ...metrics]
        this.services.set(serviceName, { name: serviceName, metrics: updatedMetrics })
        this.emit("metricsProcessed", { serviceName, metrics });
    }

    private calculateServiceScore(serviceName: string): number {
        const service = this.services.get(serviceName)
        if (!service || service.metrics.length === 0) {
            return 0
        }

        const latestMetrics = service.metrics[service.metrics.length - 1]

        // Normalize metrics (simple inverse relationship: higher score is better)
        // Assuming max acceptable values for normalization
        const MAX_LATENCY = 500
        const MAX_ERROR_RATE = 10
        const MAX_RESOURCE = 100

        const normalizedLatency = 1 - Math.min(1, latestMetrics.latencyMs / MAX_LATENCY)
        const normalizedErrorRate = 1 - Math.min(1, latestMetrics.errorCount / MAX_ERROR_RATE)
        const normalizedResourceUsage = 1 - Math.min(1, latestMetrics.resourceUsagePercent / MAX_RESOURCE)

        // Calculate weighted score (0 to 1)
        const score = (
            normalizedLatency * this.config.weights.latency +
            normalizedErrorRate * this.config.weights.errorRate +
            normalizedResourceUsage * this.config.weights.resourceUsage
        )

        return Math.max(0, Math.min(1, score))
    }

    private calculateCompositeHealthScore(): number {
        let totalScore = 0
        const serviceScores: Record<string, number> = {}

        for (const [name, service] of this.services.entries()) {
            const score = this.calculateServiceScore(name)
            serviceScores[name] = score
            totalScore += score
        }

        const averageScore = totalScore / Math.max(1, this.services.size)
        return averageScore
    }

    checkHealthAndAdapt(): void {
        const overallScore = this.calculateCompositeHealthScore()
        console.log(`[Health Monitor] Overall System Health Score: ${overallScore.toFixed(3)}`)

        if (overallScore < this.config.criticalThreshold) {
            this.emit("healthDegraded", { score: overallScore, threshold: this.config.criticalThreshold })
            this.triggerFallbackStrategy(overallScore)
        } else {
            this.emit("healthStable", { score: overallScore })
        }
    }

    private triggerFallbackStrategy(score: number): void {
        if (score < 0.5) {
            console.warn("[Adaptive Action] CRITICAL FAILURE: Initiating full fallback plan (e.g., degraded mode, cache usage).")
            // Example: Call a fallback service or adjust system parameters
            this.emit("fallbackTriggered", { strategy: "Degraded Mode Activation" })
        } else if (score < 0.7) {
            console.warn("[Adaptive Action] WARNING: Initiating partial fallback (e.g., rate limiting, circuit breaker).")
            this.emit("fallbackTriggered", { strategy: "Rate Limiting/Circuit Breaker" })
        } else {
            console.log("[Adaptive Action] No immediate fallback required.")
        }
    }
}

export { AdaptiveServiceHealthMonitor }