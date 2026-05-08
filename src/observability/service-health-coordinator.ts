export type MetricValue = number;

export interface Metric {
  sourceId: string;
  metricName: string;
  value: MetricValue;
  timestamp: number;
}

export interface SLI {
  name: string;
  description: string;
  calculatedValue: MetricValue;
}

export interface SLO {
  name: string;
  threshold: {
    type: "max" | "min";
    value: MetricValue;
  };
  severity: "critical" | "warning" | "info";
}

export interface HealthReport {
  overallStatus: "healthy" | "degraded" | "critical";
  details: Record<string, {
    sli: SLI;
    slo: SLO;
    status: "ok" | "breached";
    message: string;
  }>;
  mitigationPlan: string[];
}

export class ServiceHealthCoordinator {
  private sloDefinitions: SLO[];

  constructor(sloDefinitions: SLO[]) {
    this.sloDefinitions = sloDefinitions;
  }

  private calculateErrorRate(metrics: Metric[]): number {
    const total = metrics.length;
    if (total === 0) return 0;
    const errors = metrics.filter(m => m.metricName === "error_count").length;
    return errors / total;
  }

  private calculateAverageLatency(metrics: Metric[]): number {
    const latencyMetrics = metrics.filter(m => m.metricName === "latency_ms");
    if (latencyMetrics.length === 0) return 0;
    const sum = latencyMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / latencyMetrics.length;
  }

  private processMetrics(metrics: Metric[]): SLI[] {
    const sli: SLI[] = [];

    const errorRate = this.calculateErrorRate(metrics);
    sli.push({
      name: "error_rate",
      description: "Ratio of failed requests to total requests.",
      calculatedValue: errorRate,
    });

    const avgLatency = this.calculateAverageLatency(metrics);
    sli.push({
      name: "average_latency",
      description: "Average request latency in milliseconds.",
      calculatedValue: avgLatency,
    });

    return sli;
  }

  private determineStatus(sli: SLI, slo: SLO): {
    status: "ok" | "breached";
    message: string;
  } {
    let isBreached = false;
    const { type, value } = slo.threshold;

    if (type === "max" && sli.calculatedValue > value) {
      isBreached = true;
    } else if (type === "min" && sli.calculatedValue < value) {
      isBreached = true;
    }

    if (isBreached) {
      return {
        status: "breached",
        message: `SLO ${slo.name} breached. Current ${sli.name} (${sli.calculatedValue.toFixed(2)}) exceeds ${slo.threshold.type} threshold of ${slo.threshold.value.toFixed(2)}.`,
      };
    }
    return {
      status: "ok",
      message: `SLO ${slo.name} met. Current ${sli.name} (${sli.calculatedValue.toFixed(2)}) is within acceptable limits.`,
    };
  }

  private generateMitigationPlan(report: HealthReport): string[] {
    const plan: string[] = [];
    if (report.overallStatus === "critical") {
      plan.push("CRITICAL ACTION: Immediately scale up resources and investigate root cause.");
    } else if (report.overallStatus === "degraded") {
      plan.push("WARNING ACTION: Review recent deployments and consider temporary traffic throttling.");
    } else {
      plan.push("System stable. Continue monitoring.");
    }
    return plan;
  }

  evaluateHealth(metrics: Metric[]): HealthReport {
    const calculatedSLIs = this.processMetrics(metrics);
    const details: Record<string, {
      sli: SLI;
      slo: SLO;
      status: "ok" | "breached";
      message: string;
    }> = {};

    let overallStatus: "healthy" | "degraded" | "critical" = "healthy";

    for (const sli of calculatedSLIs) {
      // Simple mapping: assume one SLO per SLI for demonstration
      const slo = this.sloDefinitions.find(s => s.name === `${sli.name}_slo`) || {
        name: `${sli.name}_slo`,
        threshold: { type: "max", value: sli.calculatedValue * 1.5 },
        severity: "warning",
      };

      const { status, message } = this.determineStatus(sli, slo);
      details[sli.name] = { sli, slo, status, message };

      if (status === "breached") {
        if (overallStatus === "healthy") {
          overallStatus = "degraded";
        } else if (overallStatus === "degraded") {
          overallStatus = "critical";
        }
      }
    }

    const mitigationPlan = this.generateMitigationPlan({
      overallStatus,
      details,
      mitigationPlan: [],
    });

    return {
      overallStatus,
      details,
      mitigationPlan,
    };
  }
}

export { ServiceHealthCoordinator };