import { EventEmitter } from "node:events";

export type ConstraintScope = "financial" | "compliance" | "security" | "general";

export interface ConstraintRule {
  ruleId: string;
  description: string;
  validationFn: (input: Record<string, unknown>) => boolean;
}

export interface PolicyConstraintPayload {
  rule: ConstraintRule;
  scope: ConstraintScope;
  durationMs: number;
  priority: number;
}

export interface ActiveConstraint {
  payload: PolicyConstraintPayload;
  startTime: number;
  endTime: number;
}

class ConstraintManager {
  private activeConstraints: Map<ConstraintScope, ActiveConstraint[]> = new Map();

  getConstraints(scope: ConstraintScope): ActiveConstraint[] {
    return this.activeConstraints.get(scope) || [];
  }

  addConstraint(constraint: ActiveConstraint, scope: ConstraintScope): void {
    if (!this.activeConstraints.has(scope)) {
      this.activeConstraints.set(scope, []);
    }
    const constraints = this.activeConstraints.get(scope)!;
    constraints.push(constraint);
    constraints.sort((a, b) => b.payload.priority - a.payload.priority);
  }

  removeConstraint(scope: ConstraintScope, ruleId: string): boolean {
    let constraints = this.activeConstraints.get(scope);
    if (!constraints) return false;

    const initialLength = constraints.length;
    const updatedConstraints = constraints.filter(c => c.payload.rule.ruleId !== ruleId);
    this.activeConstraints.set(scope, updatedConstraints);

    return updatedConstraints.length < initialLength;
  }
}

class ContextualConstraintPropagator extends EventEmitter {
  private currentContext: Map<ConstraintScope, Set<string>> = new Map();

  propagate(scope: ConstraintScope, constraintId: string): void {
    if (!this.currentContext.has(scope)) {
      this.currentContext.set(scope, new Set());
    }
    this.currentContext.get(scope)!.add(constraintId);
    this.emit("context_updated", scope, constraintId);
  }

  depropagate(scope: ConstraintScope, constraintId: string): void {
    const constraintIds = this.currentContext.get(scope);
    if (constraintIds) {
      constraintIds.delete(constraintId);
      this.emit("context_updated", scope, constraintId);
    }
  }

  getConstraintsForScope(scope: ConstraintScope): Set<string> {
    return this.currentContext.get(scope) || new Set();
  }
}

export class PolicyConstraintInjector {
  private constraintManager: ConstraintManager;
  private propagator: ContextualConstraintPropagator;

  constructor(constraintManager: ConstraintManager, propagator: ContextualConstraintPropagator) {
    this.constraintManager = constraintManager;
    this.propagator = propagator;
  }

  injectConstraint(payload: PolicyConstraintPayload): void {
    const now = Date.now();
    const endTime = now + payload.durationMs;

    const activeConstraint: ActiveConstraint = {
      payload: payload,
      startTime: now,
      endTime: endTime,
    };

    this.constraintManager.addConstraint(activeConstraint, payload.scope);
    this.propagator.propagate(payload.scope, payload.rule.ruleId);
  }

  removeConstraint(scope: ConstraintScope, ruleId: string): boolean {
    const wasRemoved = this.constraintManager.removeConstraint(scope, ruleId);
    if (wasRemoved) {
      this.propagator.depropagate(scope, ruleId);
    }
    return wasRemoved;
  }

  /**
   * Retrieves the highest priority active constraint for a given scope.
   * @param scope The constraint scope.
   * @returns The highest priority active constraint or null.
   */
  getHighestPriorityConstraint(scope: ConstraintScope): ActiveConstraint | null {
    const constraints = this.constraintManager.getConstraints(scope);
    if (constraints.length === 0) {
      return null;
    }
    // Constraints are kept sorted by priority descending in ConstraintManager
    return constraints[0];
  }
}