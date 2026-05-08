import { EventEmitter } from "node:events";

export type AgentRunId = string;

export interface HealthMetric {
  timestamp: number;
  stage: string;
  metricName: string;
  value: unknown;
  unit?: string;
  success: boolean;
}

export interface MonitorContext {
  runId: AgentRunId;
  metrics: HealthMetric[];
  startTime: number;
  endTime: number | null;
}

export interface HealthReport {
  runId: AgentRunId;
  overallHealthScore: number;
  summary: string;
  metrics: ReadonlyArray<HealthMetric>;
}

export class AgentHealthMonitor extends EventEmitter {
  private context: MonitorContext;
  private readonly metrics: HealthMetric[] = [];

  constructor(runId: AgentRunId) {
    super();
    this.context = {
      runId,
      metrics: [],
      startTime: Date.now(),
      endTime: null,
    };
  }

  private recordMetric(stage: string, metricName: string, value: unknown, success: boolean = true, unit?: string): void {
    const metric: HealthMetric = {
      timestamp: Date.now(),
      stage,
      metricName,
      value,
      unit,
      success,
    };
    this.metrics.push(metric);
    this.emit("metricRecorded", { metric, stage });
  }

  public onPlanStart(planDurationMs: number, initialResourceUsage: Record<string, number>): void {
    this.recordMetric("PlanStart", "PlanDurationMs", planDurationMs, true, "ms");
    this.recordMetric("PlanStart", "InitialResourceUsage", initialResourceUsage, true);
  }

  public onToolExecute(toolName: string, latencyMs: number, resourceUsage: Record<string, number>, success: boolean): void {
    this.recordMetric("ToolExecute", "ToolName", toolName, success);
    this.recordMetric("ToolExecute", "LatencyMs", latencyMs, success, "ms");
    this.recordMetric("ToolExecute", "ResourceUsage", resourceUsage, success);
  }

  public onContextEnrichment(enrichmentSource: string, latencyMs: number, complianceViolations: number): void {
    this.recordMetric("ContextEnrichment", "Source", enrichmentSource, true);
    this.recordMetric("ContextEnrichment", "LatencyMs", latencyMs, true, "ms");
    this.recordMetric("ContextEnrichment", "ComplianceViolations", complianceViolations, true);
  }

  public onRunCompletion(): void {
    this.context.endTime = Date.now();
    this.recordMetric("RunCompletion", "TotalRunDurationMs", this.context.endTime! - this.context.startTime, true, "ms");
  }

  public getHealthReport(): HealthReport {
    const totalDuration = this.context.endTime! - this.context.startTime;
    const successfulMetrics = this.metrics.filter(m => m.success);
    const failedMetrics = this.metrics.filter(m => !m.success);

    const overallHealthScore = Math.max(0, 100 - (failedMetrics.length * 10));

    const summary = `Agent run completed. Total duration: ${totalDuration}ms. ${successfulMetrics.length} metrics recorded successfully. ${failedMetrics.length} failures detected.`;

    return {
      runId: this.context.runId,
      overallHealthScore: overallHealthScore,
      summary: summary,
      metrics: [...this.metrics],
    };
  }
}