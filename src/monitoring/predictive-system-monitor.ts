import { EventEmitter } from 'node:events';

export interface TimeSeriesDataPoint {
    timestamp: number;
    value: number;
}

export interface SLO {
    metricName: string;
    description: string;
    thresholds: {
        max: number;
        min: number;
    };
    predictionWindowHours: number;
}

export interface PredictionReport {
    streamId: string;
    metricName: string;
    violationType: "Exceeds Max" | "Drops Below Min" | "None";
    predictedViolationValue: number;
    timeToViolationHours: number;
    recommendedAction: string;
}

export class PredictiveSystemMonitor extends EventEmitter {
    private dataStreams: Map<string, number[]> = new Map();
    private sloDefinitions: Map<string, SLO> = new Map();

    constructor() {
        super();
    }

    addSLO(slo: SLO): void {
        this.sloDefinitions.set(slo.metricName, slo);
    }

    ingestData(streamId: string, data: number[]): void {
        if (!data || data.length === 0) {
            return;
        }
        
        const currentData = this.dataStreams.get(streamId) || [];
        
        // Simple append logic for demonstration
        const newData = [...currentData, ...data];
        this.dataStreams.set(streamId, newData);
        
        this.emit('dataIngested', { streamId, count: newData.length });
    }

    /**
     * Calculates the linear extrapolation slope (rate of change) from the last N points.
     * @param data The array of historical values.
     * @param windowSize The number of points to consider for the slope calculation.
     * @returns The calculated slope (rate of change).
     */
    private calculateSlope(data: number[], windowSize: number = 5): number {
        if (data.length < 2) {
            return 0;
        }
        
        const relevantData = data.slice(-Math.min(data.length, windowSize));
        
        let sumOfDifferences = 0;
        for (let i = 1; i < relevantData.length; i++) {
            // Assuming uniform time steps for simplicity (time step = 1 unit)
            sumOfDifferences += (relevantData[i] - relevantData[i - 1]);
        }
        
        // Average rate of change
        return sumOfDifferences / (relevantData.length - 1);
    }

    /**
     * Predicts the future value based on linear extrapolation.
     * @param data The historical data.
     * @param hoursAhead The number of time units (hours) into the future to predict.
     * @returns The predicted value.
     */
    private predictValue(data: number[], hoursAhead: number): number {
        if (data.length === 0) {
            return NaN;
        }
        
        const lastValue = data[data.length - 1];
        const slope = this.calculateSlope(data);
        
        // Prediction = Last Value + (Slope * Time Steps)
        return lastValue + (slope * hoursAhead);
    }

    checkProactiveViolations(): PredictionReport[] {
        const reports: PredictionReport[] = [];

        for (const [streamId, data] of this.dataStreams.entries()) {
            
            // Iterate through all defined SLOs to check against this stream's data
            for (const [metricName, slo] of this.sloDefinitions.entries()) {
                
                // Simple heuristic: Assume streamId matches metricName for this demo
                if (!streamId.includes(metricName.toLowerCase())) {
                    continue;
                }

                const predictionWindowHours = slo.predictionWindowHours;
                
                // 1. Predict the future state
                const predictedValue = this.predictValue(data, predictionWindowHours);

                if (isNaN(predictedValue)) {
                    continue;
                }

                // 2. Check against SLO thresholds
                let violationType: "Exceeds Max" | "Drops Below Min" | "None" = "None";
                let recommendedAction: string = "Monitor closely. No immediate action required.";

                if (predictedValue > slo.thresholds.max) {
                    violationType = "Exceeds Max";
                    recommendedAction = `High risk: Predicted value (${predictedValue.toFixed(2)}) exceeds max SLO (${slo.thresholds.max}). Consider throttling or scaling up resources.`;
                } else if (predictedValue < slo.thresholds.min) {
                    violationType = "Drops Below Min";
                    recommendedAction = `Critical risk: Predicted value (${predictedValue.toFixed(2)}) drops below min SLO (${slo.thresholds.min}). Investigate potential resource depletion or failure.`;
                }

                if (violationType !== "None") {
                    reports.push({
                        streamId: streamId,
                        metricName: metricName,
                        violationType: violationType,
                        predictedViolationValue: predictedValue,
                        timeToViolationHours: predictionWindowHours,
                        recommendedAction: recommendedAction
                    });
                }
            }
        }

        return reports;
    }
}