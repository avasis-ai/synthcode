export type CapabilityName = string;

export interface InvocationRecord {
  timestamp: number;
  latencyMs: number;
  success: boolean;
  resourceUsageBytes: number;
}

export interface CapabilityMetrics {
  totalInvocations: number;
  averageLatencyMs: number;
  successRate: number;
  averageResourceUsageBytes: number;
}

export interface Baseline {
  averageLatencyMs: number;
  stdDevLatencyMs: number;
  averageSuccessRate: number;
  stdDevSuccessRate: number;
  averageResourceUsageBytes: number;
  stdDevResourceUsageBytes: number;
}

export interface DriftReport {
  isDrifting: boolean;
  details: Record<string, {
    metric: string;
    currentValue: number;
    baseline: number;
    deviationFactor: number;
    thresholdExceeded: boolean;
  }>;
}

class CapabilityDriftDetector {
  private history: Record<CapabilityName, InvocationRecord[]> = {};
  private baseline: Record<CapabilityName, Baseline> = {};
  private readonly driftThreshold: number;

  constructor(driftThreshold: number = 2.0) {
    this.driftThreshold = driftThreshold;
  }

  private getCapabilityHistory(capabilityName: CapabilityName): InvocationRecord[] {
    if (!this.history[capabilityName]) {
      this.history[capabilityName] = [];
    }
    return this.history[capabilityName];
  }

  public recordInvocation(capabilityName: CapabilityName, record: InvocationRecord): void {
    const history = this.getCapabilityHistory(capabilityName);
    history.push(record);
  }

  private calculateMetrics(records: InvocationRecord[]): CapabilityMetrics {
    if (records.length === 0) {
      return {
        totalInvocations: 0,
        averageLatencyMs: 0,
        successRate: 0,
        averageResourceUsageBytes: 0,
      };
    }

    const totalLatency = records.reduce((sum, r) => sum + r.latencyMs, 0);
    const totalSuccess = records.filter(r => r.success).length;
    const totalResource = records.reduce((sum, r) => sum + r.resourceUsageBytes, 0);

    return {
      totalInvocations: records.length,
      averageLatencyMs: totalLatency / records.length,
      successRate: totalSuccess / records.length,
      averageResourceUsageBytes: totalResource / records.length,
    };
  }

  private calculateBaseline(records: InvocationRecord[]): Baseline {
    if (records.length < 5) {
      return {
        averageLatencyMs: 0,
        stdDevLatencyMs: 0,
        averageSuccessRate: 0,
        stdDevSuccessRate: 0,
        averageResourceUsageBytes: 0,
        stdDevResourceUsageBytes: 0,
      };
    }

    const n = records.length;

    const latencies = records.map(r => r.latencyMs);
    const successRates = records.map(r => r.success ? 1 : 0);
    const resourceUsages = records.map(r => r.resourceUsageBytes);

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = (arr: number[], meanVal: number): number => {
      return arr.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / (arr.length - 1);
    };

    return {
      averageLatencyMs: mean(latencies),
      stdDevLatencyMs: Math.sqrt(variance(latencies, mean(latencies))),
      averageSuccessRate: mean(successRates),
      stdDevSuccessRate: Math.sqrt(variance(successRates, mean(successRates))),
      averageResourceUsageBytes: mean(resourceUsages),
      stdDevResourceUsageBytes: Math.sqrt(variance(resourceUsages, mean(resourceUsages))),
    };
  }

  private calculateAndStoreBaseline(capabilityName: CapabilityName): Baseline {
    const records = this.getCapabilityHistory(capabilityName);
    const baseline = this.calculateBaseline(records);
    this.baseline[capabilityName] = baseline;
    return baseline;
  }

  public detectDrift(capabilityName: CapabilityName): DriftReport {
    const records = this.getCapabilityHistory(capabilityName);
    if (records.length < 10) {
      return {
        isDrifting: false,
        details: {},
      };
    }

    const currentMetrics = this.calculateMetrics(records);
    const baseline = this.baseline[capabilityName] || this.calculateAndStoreBaseline(capabilityName);

    const checkDrift = (current: number, baselineVal: number, stdDev: number, metricName: string): {
      deviationFactor: number;
      thresholdExceeded: boolean;
    } => {
      if (stdDev === 0) {
        return { deviationFactor: 0, thresholdExceeded: false };
      }
      const deviation = Math.abs(current - baselineVal) / stdDev;
      return {
        deviationFactor: deviation,
        thresholdExceeded: deviation > this.driftThreshold,
      };
    };

    const latencyCheck = checkDrift(currentMetrics.averageLatencyMs, baseline.averageLatencyMs, baseline.stdDevLatencyMs, "latency");
    const successCheck = checkDrift(currentMetrics.successRate, baseline.averageSuccessRate, baseline.stdDevSuccessRate, "success_rate");
    const resourceCheck = checkDrift(currentMetrics.averageResourceUsageBytes, baseline.averageResourceUsageBytes, baseline.stdDevResourceUsageBytes, "resource_usage");

    const details: Record<string, {
      metric: string;
      currentValue: number;
      baseline: number;
      deviationFactor: number;
      thresholdExceeded: boolean;
    }> = {
      latency: {
        metric: "average_latency_ms",
        currentValue: currentMetrics.averageLatencyMs,
        baseline: baseline.averageLatencyMs,
        deviationFactor: latencyCheck.deviationFactor,
        thresholdExceeded: latencyCheck.thresholdExceeded,
      },
      success_rate: {
        metric: "success_rate",
        currentValue: currentMetrics.successRate,
        baseline: baseline.averageSuccessRate,
        deviationFactor: successCheck.deviationFactor,
        thresholdExceeded: successCheck.thresholdExceeded,
      },
      resource_usage: {
        metric: "average_resource_usage_bytes",
        currentValue: currentMetrics.averageResourceUsageBytes,
        baseline: baseline.averageResourceUsageBytes,
        deviationFactor: resourceCheck.deviationFactor,
        thresholdExceeded: resourceCheck.thresholdExceeded,
      },
    };

    const isDrifting = Object.values(details).some(d => d.thresholdExceeded);

    return {
      isDrifting: isDrifting,
      details: details,
    };
  }
}

export { CapabilityDriftDetector };