import { EventEmitter } from "node:events";

type ConstraintId = string;
type Scope = string;

interface MetricData {
  latencyMs: number;
  cpuUsagePercent: number;
  errorRate: number;
}

interface Constraint {
  id: ConstraintId;
  description: string;
  isActive: boolean;
}

interface RelaxationRule {
  metricCheck: (metrics: MetricData) => boolean;
  constraintId: ConstraintId;
  scope: Scope;
  durationSeconds: number;
}

interface ConstraintRelaxationAppliedEvent {
  constraintId: ConstraintId;
  scope: Scope;
  durationSeconds: number;
  reason: string;
}

interface MetricMonitor {
  monitorMetrics(metrics: MetricData): void;
}

export class ContextualConstraintRelaxationManager extends EventEmitter {
  private activeConstraints: Map<ConstraintId, Constraint> = new Map();
  private rules: RelaxationRule[];
  private currentRelaxations: Map<ConstraintId, { endTime: number; scope: Scope }> = new Map();

  constructor(rules: RelaxationRule[]) {
    super();
    this.rules = rules;
  }

  setConstraints(constraints: Constraint[]): void {
    this.activeConstraints.clear();
    constraints.forEach(c => this.activeConstraints.set(c.id, c));
  }

  monitorMetrics(metrics: MetricData): void {
    for (const rule of this.rules) {
      if (rule.metricCheck(metrics)) {
        this.applyRelaxation(rule.constraintId, rule.scope, rule.durationSeconds, `Triggered by metrics: Latency=${metrics.latencyMs}ms, ErrorRate=${metrics.errorRate}`);
      }
    }
  }

  private applyRelaxation(constraintId: ConstraintId, scope: Scope, durationSeconds: number, reason: string): void {
    if (this.currentRelaxations.has(constraintId) && this.currentRelaxations.get(constraintId)!.endTime > Date.now()) {
      return
    }

    const endTime = Date.now() + durationSeconds * 1000;
    this.currentRelaxations.set(constraintId, { endTime, scope });

    const constraint = this.activeConstraints.get(constraintId);
    if (constraint) {
      constraint.isActive = false; // Temporarily deactivate
      this.emit("constraintRelaxationApplied", {
        constraintId,
        scope,
        durationSeconds,
        reason,
      } as ConstraintRelaxationAppliedEvent);
    }

    setTimeout(() => {
      this.revertRelaxation(constraintId);
    }, durationSeconds * 1000);
  }

  private revertRelaxation(constraintId: ConstraintId): void {
    const constraint = this.activeConstraints.get(constraintId);
    if (constraint) {
      constraint.isActive = true;
      this.currentRelaxations.delete(constraintId);
      this.emit("constraintReverted", { constraintId, scope: "N/A" } as any);
    }
  }

  /**
   * Checks if a constraint is currently relaxed or active.
   */
  isConstraintActive(constraintId: ConstraintId): boolean {
    const constraint = this.activeConstraints.get(constraintId);
    if (!constraint) return false;

    if (this.currentRelaxations.has(constraintId)) {
      return false
    }
    return constraint.isActive;
  }
}