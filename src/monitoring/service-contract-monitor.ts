class ContractMetrics {
    private endpoint: string;
    private totalCalls: number = 0;
    private successCalls: number = 0;
    private errorCounts: Map<number, number> = new Map();
    private latencySamples: number[] = [];
    private payloadConsistencyChecks: Map<string, number> = new Map();

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    recordCall(statusCode: number, latencyMs: number, payload: Record<string, unknown>): void {
        this.totalCalls++;
        this.latencySamples.push(latencyMs);

        if (statusCode >= 200 && statusCode < 300) {
            this.successCalls++;
        } else {
            this.errorCounts.set(statusCode, (this.errorCounts.get(statusCode) || 0) + 1);
        }

        this.recordPayloadConsistency(payload);
    }

    private recordPayloadConsistency(payload: Record<string, unknown>): void {
        // Simple consistency check: count how many times a specific field appears (or just track the presence of keys)
        // For simplicity, we'll just track the number of keys present.
        const keyCount = Object.keys(payload).length;
        this.payloadConsistencyChecks.set("key_count", (this.payloadConsistencyChecks.get("key_count") || 0) + 1);
    }

    getSuccessRate(): number {
        return this.totalCalls > 0 ? this.successCalls / this.totalCalls : 0;
    }

    getAverageLatency(): number {
        if (this.latencySamples.length === 0) return 0;
        const sum = this.latencySamples.reduce((acc, val) => acc + val, 0);
        return sum / this.latencySamples.length;
    }

    getErrorDistribution(): Map<number, number> {
        return new Map(this.errorCounts);
    }

    getPayloadKeyCount(): number {
        return this.payloadConsistencyChecks.get("key_count") || 0;
    }

    getMetrics(): {
        totalCalls: number;
        successRate: number;
        avgLatency: number;
        errorDistribution: Map<number, number>;
        payloadKeyCount: number;
    } {
        return {
            totalCalls: this.totalCalls,
            successRate: this.getSuccessRate(),
            avgLatency: this.getAverageLatency(),
            errorDistribution: this.getErrorDistribution(),
            payloadKeyCount: this.getPayloadKeyCount(),
        };
    }
}

interface ApiResult {
    statusCode: number;
    latencyMs: number;
    payload: Record<string, unknown>;
    isError: boolean;
}

interface ContractDriftReport {
    endpoint: string;
    driftDetected: boolean;
    report: string;
}

export class ContractMonitor {
    private metricsStore: Map<string, ContractMetrics> = new Map();
    private readonly DRIFT_THRESHOLD_RATE: number = 0.15; // 15% change in success rate
    private readonly MIN_CALLS_FOR_DRIFT_CHECK: number = 10;

    private getMetrics(endpoint: string): ContractMetrics {
        if (!this.metricsStore.has(endpoint)) {
            this.metricsStore.set(endpoint, new ContractMetrics(endpoint));
        }
        return this.metricsStore.get(endpoint)!;
    }

    public recordResult(endpoint: string, result: ApiResult): void {
        const metrics = this.getMetrics(endpoint);
        metrics.recordCall(result.statusCode, result.latencyMs, result.payload);
    }

    public driftCheck(endpoint: string): ContractDriftReport {
        const metrics = this.getMetrics(endpoint);
        const currentMetrics = metrics.getMetrics();

        if (currentMetrics.totalCalls < this.MIN_CALLS_FOR_DRIFT_CHECK) {
            return { endpoint, driftDetected: false, report: "Insufficient data for drift check." };
        }

        let driftDetected = false;
        let report = `Contract stable. Total calls: ${currentMetrics.totalCalls}. Success Rate: ${(currentMetrics.successRate * 100).toFixed(2)}%.`;

        // 1. Check Success Rate Drift
        // (We assume a baseline of 0.95 success rate for demonstration, or we'd need to store baseline)
        const assumedBaselineSuccessRate = 0.95;
        const rateDeviation = Math.abs(currentMetrics.successRate - assumedBaselineSuccessRate);

        if (rateDeviation > this.DRIFT_THRESHOLD_RATE) {
            driftDetected = true;
            report += `\n[ALERT] Significant success rate drift detected! Expected rate near ${assumedBaselineSuccessRate * 100}%, but observed ${ (currentMetrics.successRate * 100).toFixed(2)}%.`;
        }

        // 2. Check Error Code Pattern Drift (e.g., sudden 403 spike)
        const errorDistribution = currentMetrics.errorDistribution;
        for (const [code, count] of errorDistribution.entries()) {
            if (code === 403 && count / currentMetrics.totalCalls > 0.20) {
                driftDetected = true;
                report += `\n[ALERT] High frequency of 403 Forbidden errors (${((count / currentMetrics.totalCalls) * 100).toFixed(1)}%) detected. Possible permission contract change.`;
            }
        }

        // 3. Check Payload Consistency Drift (e.g., key count drop)
        // This is highly heuristic, but we check if the key count is suspiciously low.
        if (currentMetrics.payloadKeyCount < 5 && currentMetrics.totalCalls > 20) {
            driftDetected = true;
            report += `\n[WARNING] Payload consistency concern: Average key count is low (${currentMetrics.payloadKeyCount}). Payload structure may have simplified unexpectedly.`;
        }

        return { endpoint, driftDetected, report };
    }
}

export { ContractMonitor }