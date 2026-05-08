class StatisticalAnomalyDetector {
    private windowSize: number;
    private threshold: number;
    private buffer: number[];

    constructor(windowSize: number, threshold: number) {
        if (windowSize <= 0) {
            throw new Error("Window size must be positive.");
        }
        if (threshold < 0) {
            throw new Error("Threshold must be non-negative.");
        }
        this.windowSize = windowSize;
        this.threshold = threshold;
        this.buffer = [];
    }

    private calculateMean(data: number[]): number {
        if (data.length === 0) return 0;
        return data.reduce((acc, val) => acc + val, 0) / data.length;
    }

    private calculateStandardDeviation(data: number[], mean: number): number {
        if (data.length < 2) return 0;
        const squaredDifferencesSum = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        // Using sample standard deviation (N-1) is often preferred, but for simplicity and consistency with basic rolling stats, N is fine if the window is treated as the population. Let's use N for simplicity here.
        return Math.sqrt(squaredDifferencesSum / data.length);
    }

    /**
     * Processes a new metric value and determines if it is an anomaly.
     * @param value The new metric value.
     * @returns An object containing the detection result and the updated state.
     */
    processValue(value: number): { isAnomaly: boolean; mean: number; stdDev: number; upperBound: number; lowerBound: number } {
        if (this.buffer.length < 2) {
            // Not enough data to calculate meaningful standard deviation
            this.buffer.push(value);
            return { isAnomaly: false, mean: 0, stdDev: 0, upperBound: Infinity, lowerBound: -Infinity };
        }

        const mean = this.calculateMean(this.buffer);
        const stdDev = this.calculateStandardDeviation(this.buffer, mean);

        const upperLimit = mean + this.threshold * stdDev;
        const lowerLimit = mean - this.threshold * stdDev;

        const isAnomaly = value > upperLimit || value < lowerLimit;

        // Update buffer
        this.buffer.push(value);
        if (this.buffer.length > this.windowSize) {
            this.buffer.shift();
        }

        return {
            isAnomaly,
            mean: mean,
            stdDev: stdDev,
            upperBound: upperLimit,
            lowerBound: lowerLimit
        };
    }
}

export { StatisticalAnomalyDetector };