import { EventEmitter } from "events";

export interface HealthMetric {
  latencyMs: number;
  successCount: number;
  errorCount: number;
  resourceUsageBytes: number;
}

export interface ComponentMetrics {
  lastUpdated: number;
  metrics: HealthMetric;
}

export class AgentHealthMonitor extends EventEmitter {
  private componentMetrics: Map<string, ComponentMetrics>;
  private readonly WINDOW_SIZE_MS: number;

  constructor(windowSizeMs: number = 30000) {
    super();
    this.componentMetrics = new Map();
    this.WINDOW_SIZE_MS = windowSizeMs;
  }

  private getComponentMetrics(componentId: string): ComponentMetrics {
    if (!this.componentMetrics.has(componentId)) {
      this.componentMetrics.set(componentId, {
        lastUpdated: Date.now(),
        metrics: {
          latencyMs: 0,
          successCount: 0,
          errorCount: 0,
          resourceUsageBytes: 0,
        },
      });
    }
    return this.componentMetrics.get(componentId)!;
  }

  public recordMetric(componentId: string, latencyMs: number, success: boolean, resourceUsageBytes: number): void {
    const component = this.getComponentMetrics(componentId);

    const now = Date.now();
    const timeSinceLastUpdate = now - component.lastUpdated;

    if (timeSinceLastUpdate > this.WINDOW_SIZE_MS) {
      component.metrics = {
        latencyMs: 0,
        successCount: 0,
        errorCount: 0,
        resourceUsageBytes: 0,
      };
    }

    component.metrics.latencyMs = (component.metrics.metrics.latencyMs * (timeSinceLastUpdate / this.WINDOW_SIZE_MS) + latencyMs) / (timeSinceLastUpdate / this.WINDOW_SIZE_MS + 1);
    component.metrics.successCount += success ? 1 : 0;
    component.metrics.errorCount += success ? 0 : 1;
    component.metrics.resourceUsageBytes = (component.metrics.metrics.resourceUsageBytes * (timeSinceLastUpdate / this.WINDOW_SIZE_MS) + resourceUsageBytes) / (timeSinceLastUpdate / this.WINDOW_SIZE_MS + 1);
    component.lastUpdated = now;

    this.componentMetrics.set(componentId, component);
    this.emit("metricRecorded", { componentId, metrics: component.metrics });
  }

  public getHealthScore(): number {
    let totalScore = 0;
    let componentCount = 0;

    for (const [id, component] of this.componentMetrics.entries()) {
      componentCount++;
      const metrics = component.metrics;

      const errorRate = metrics.successCount === 0 ? 0 : metrics.errorCount / metrics.successCount + metrics.errorCount / (metrics.successCount + 1);
      const latencyPenalty = Math.min(1, metrics.latencyMs / 5000); // Cap penalty at 1
      const resourcePenalty = Math.min(1, metrics.resourceUsageBytes / (1024 * 1024)); // Penalty per MB

      // Simple weighted score: Base - (ErrorRate * Weight) - (LatencyPenalty * Weight) - (ResourcePenalty * Weight)
      const componentScore = 100 - (errorRate * 50) - (latencyPenalty * 20) - (resourcePenalty * 10);
      totalScore += Math.max(0, componentScore);
    }

    if (componentCount === 0) {
      return 50; // Neutral score if nothing is monitored
    }

    return Math.min(100, Math.max(0, totalScore / componentCount));
  }
}