export type TimeSeriesDataPoint = {
  timestamp: number;
  value: number;
};

export interface TimeSeriesSignal {
  mean: number;
  variance: number;
  trend: "Rising" | "Falling" | "Stable" | "Unknown";
  signal_strength: number;
  description: string;
}

export class TimeSeriesContextProcessor {
  private dataPoints: TimeSeriesDataPoint[] = [];
  private windowSize: number;

  constructor(windowSize: number = 10) {
    if (windowSize < 2) {
      throw new Error("Window size must be at least 2.");
    }
    this.windowSize = windowSize;
  }

  public addDataPoint(dataPoint: TimeSeriesDataPoint): void {
    this.dataPoints.push(dataPoint);
  }

  private getWindowData(): number[] {
    if (this.dataPoints.length < this.windowSize) {
      return [];
    }
    return this.dataPoints
      .slice(this.dataPoints.length - this.windowSize)
      .map(p => p.value);
  }

  private calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((acc, val) => acc + val, 0) / data.length;
  }

  private calculateVariance(data: number[], mean: number): number {
    if (data.length < 2) return 0;
    const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((acc, val) => acc + val, 0);
    // Using sample variance (N-1)
    return sumOfSquaredDifferences / (data.length - 1);
  }

  private determineTrend(data: number[]): "Rising" | "Falling" | "Stable" {
    if (data.length < 3) return "Stable";

    const firstThree = data.slice(0, 3);
    const lastThree = data.slice(-3);

    const initialSlope = (firstThree[2] - firstThree[0]) / (firstThree[2] - firstThree[0]);
    const finalSlope = (lastThree[2] - lastThree[0]) / (lastThree[2] - lastThree[0]);

    // Simple comparison of slopes
    if (Math.abs(initialSlope - 1) > 0.2 && Math.abs(finalSlope - 1) > 0.2) {
      if (finalSlope > initialSlope * 1.1) return "Rising";
      if (finalSlope < initialSlope * 0.9) return "Falling";
    }
    return "Stable";
  }

  public analyze(): TimeSeriesSignal | null {
    const windowData = this.getWindowData();

    if (windowData.length === 0) {
      return null;
    }

    const mean = this.calculateMean(windowData);
    const variance = this.calculateVariance(windowData, mean);
    const trend = this.determineTrend(windowData);

    let signalStrength = 0;
    let description = "";

    if (variance > 0.1) {
      signalStrength = Math.min(1.0, Math.sqrt(variance) * 1.5);
      description = `High volatility detected. Variance: ${variance.toFixed(2)}.`;
    } else {
      description = "Stable readings within normal parameters.";
    }

    if (trend === "Rising") {
      signalStrength = Math.max(signalStrength, 0.6);
      description += " Trend: Rising. Potential upward momentum detected.";
    } else if (trend === "Falling") {
      signalStrength = Math.max(signalStrength, 0.6);
      description += " Trend: Falling. Potential downward momentum detected.";
    }

    return {
      mean: mean,
      variance: variance,
      trend: trend,
      signal_strength: Math.min(1.0, signalStrength),
      description: description,
    };
  }
}

export { TimeSeriesContextProcessor };