export type SLOAction = "throttle" | "fallback" | "escalate";

export interface SLO {
  metricName: "success_rate" | "latency";
  threshold: number;
  windowSizeMs: number;
  action: SLOAction;
}

export interface MetricRecord {
  timestamp: number;
  isSuccess: boolean;
  latencyMs: number;
}

export class ServiceLevelObjectiveMonitor {
  private sloObjectives: SLO[];
  private metricHistory: MetricRecord[] = [];
  private readonly windowSizeMs: number;

  constructor(sloObjectives: SLO[], windowSizeMs: number = 60000) {
    this.sloObjectives = sloObjectives;
    this.windowSizeMs = windowSizeMs;
  }

  private recordMetric(isSuccess: boolean, latencyMs: number): void {
    const now = Date.now();
    const record: MetricRecord = {
      timestamp: now,
      isSuccess: isSuccess,
      latencyMs: latencyMs,
    };
    this.metricHistory.push(record);
    this.pruneHistory(now);
  }

  private pruneHistory(currentTime: number): void {
    this.metricHistory = this.metricHistory.filter(
      (record) => currentTime - record.timestamp < this.windowSizeMs
    );
  }

  private calculateMetrics(): {
    successCount: number;
    failureCount: number;
    averageLatencyMs: number;
    totalCount: number;
  } {
    const history = this.metricHistory;
    let successCount = 0;
    let failureCount = 0;
    let totalLatency = 0;
    const totalCount = history.length;

    for (const record of history) {
      if (record.isSuccess) {
        successCount++;
      } else {
        failureCount++;
      }
      totalLatency += record.latencyMs;
    }

    return {
      successCount,
      failureCount,
      averageLatencyMs: totalCount > 0 ? totalLatency / totalCount : 0,
      totalCount,
    };
  }

  private evaluateSLO(metric: "success_rate" | "latency", value: number, threshold: number): boolean {
    switch (metric) {
      case "success_rate":
        return value >= threshold;
      case "latency":
        return value <= threshold;
      default:
        return false;
    }
  }

  private executeAction(action: SLOAction): void {
    switch (action) {
      case "throttle":
        console.warn("SLO BREACH: Throttling execution rate.");
        break;
      case "fallback":
        console.warn("SLO BREACH: Initiating fallback mechanism.");
        break;
      case "escalate":
        console.error("SLO BREACH: Critical failure detected. Escalating alert.");
        break;
    }
  }

  public evaluateAndAct(): void {
    const metrics = this.calculateMetrics();

    for (const slo of this.sloObjectives) {
      let isBreached = false;
      let currentValue: number = 0;

      if (slo.metricName === "success_rate") {
        if (metrics.totalCount === 0) continue;
        currentValue = metrics.successCount / metrics.totalCount;
        isBreached = !this.evaluateSLO("success_rate", currentValue, slo.threshold);
      } else if (slo.metricName === "latency") {
        currentValue = metrics.averageLatencyMs;
        isBreached = !this.evaluateSLO("latency", currentValue, slo.threshold);
      }

      if (isBreached) {
        this.executeAction(slo.action);
      }
    }
  }

  public recordOperation(isSuccess: boolean, latencyMs: number): void {
    this.recordMetric(isSuccess, latencyMs);
    this.evaluateAndAct();
  }
}