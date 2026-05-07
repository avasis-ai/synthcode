export type JobContext = {
    jobId: string;
    startTime: number;
    // Add other context fields if necessary
};

export interface HistoryStore {
    getHistoricalStepCounts(): number[];
    getHistoricalStepDurations(): number[];
}

export interface ProcessAnomalyReport {
    isAnomaly: boolean;
    message: string;
    details: {
        stepCountDeviation: number;
        stepDurationDeviation: number;
    };
}

export class ProcessAnomalyDetector {
    private historyStore: HistoryStore;
    private thresholdSigma: number;

    constructor(historyStore: HistoryStore, thresholdSigma: number = 3) {
        this.historyStore = historyStore;
        this.thresholdSigma = thresholdSigma;
    }

    private calculateMean(data: number[]): number {
        if (data.length === 0) return 0;
        return data.reduce((acc, val) => acc + val, 0) / data.length;
    }

    private calculateStandardDeviation(data: number[], mean: number): number {
        if (data.length < 2) return 0;
        const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
        const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / (data.length - 1);
        return Math.sqrt(variance);
    }

    private analyzeMetric(currentValue: number, historicalData: number[], metricName: string): {
        mean: number;
        stdDev: number;
        deviation: number;
    } {
        const mean = this.calculateMean(historicalData);
        const stdDev = this.calculateStandardDeviation(historicalData, mean);

        if (stdDev === 0) {
            return { mean, stdDev: 0, deviation: Math.abs(currentValue - mean) };
        }

        const deviation = Math.abs(currentValue - mean) / stdDev;
        return { mean, stdDev, deviation };
    }

    public detectAnomaly(currentStepCount: number, currentTotalDurationMs: number): ProcessAnomalyReport {
        const historicalCounts = this.historyStore.getHistoricalStepCounts();
        const historicalDurations = this.historyStore.getHistoricalStepDurations();

        const countAnalysis = this.analyzeMetric(currentStepCount, historicalCounts, "step_count");
        const durationAnalysis = this.analyzeMetric(currentTotalDurationMs, historicalDurations, "step_duration");

        const isCountAnomaly = countAnalysis.deviation > this.thresholdSigma;
        const isDurationAnomaly = durationAnalysis.deviation > this.thresholdSigma;

        const isAnomaly = isCountAnomaly || isDurationAnomaly;

        const report: ProcessAnomalyReport = {
            isAnomaly: isAnomaly,
            message: `Process drift detected. Step count deviation: ${countAnalysis.deviation.toFixed(2)} sigma. Duration deviation: ${durationAnalysis.deviation.toFixed(2)} sigma.`,
            details: {
                stepCountDeviation: countAnalysis.deviation,
                stepDurationDeviation: durationAnalysis.deviation,
            }
        };

        return report;
    }
}