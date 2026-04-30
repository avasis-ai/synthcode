import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  availableAmount: number;
}

export interface CapabilityConstraint {
  capability: string;
  level: "read" | "write" | "execute";
}

export interface Constraint {
  temporal?: TemporalConstraint;
  resource?: ResourceConstraint;
  capability?: CapabilityConstraint;
  description: string;
}

export type ExecutionStep = {
  stepId: string;
  action: (context: Map<string, any>) => Promise<{ result: any; constraints: Constraint[] }>;
};

export class ContextualConstraintPropagatorV7 {
  private accumulatedConstraints: Constraint[] = [];

  constructor() {}

  private mergeConstraints(existing: Constraint[], newConstraints: Constraint[]): Constraint[] {
    const merged: Map<string, Constraint> = new Map();

    const processConstraint = (constraint: Constraint) => {
      if (!constraint.description) return;
      const key = `${constraint.description}:${JSON.stringify(constraint)}`;

      if (!merged.has(key)) {
        merged.set(key, constraint);
      } else {
        // Simple merging strategy: take the union of non-null/undefined fields
        const existing = merged.get(key)!;
        const mergedConstraint: Constraint = {
          description: `${existing.description} | ${constraint.description}`,
          temporal: existing.temporal || constraint.temporal,
          resource: existing.resource || constraint.resource,
          capability: existing.capability || constraint.capability,
        };
        merged.set(key, mergedConstraint);
      }
    };

    existing.forEach(processConstraint);
    newConstraints.forEach(processConstraint);

    return Array.from(merged.values());
  }

  public propagate(steps: ExecutionStep[]): Promise<Constraint[]> {
    this.accumulatedConstraints = [];
    let currentConstraints: Constraint[] = [];

    return Promise.all(steps.map(async (step) => {
      const { result, constraints } = await step.action(new Map());
      currentConstraints = this.mergeConstraints(currentConstraints, constraints);
      return { result, constraints: currentConstraints };
    }));
  }

  public validatePath(proposedSteps: ExecutionStep[]): { isValid: boolean; finalConstraints: Constraint[] } {
    const tempPropagator = new ContextualConstraintPropagatorV7();
    const { finalConstraints } = tempPropagator.propagate(proposedSteps);

    const validationResult: { isValid: boolean; finalConstraints: Constraint[] } = {
      isValid: true,
      finalConstraints: finalConstraints,
    };

    // Basic validation check: Check for temporal overlaps (highly simplified)
    const temporalConstraints = finalConstraints.filter(c => c.temporal);
    for (let i = 0; i < temporalConstraints.length; i++) {
      for (let j = i + 1; j < temporalConstraints.length; j++) {
        const c1 = temporalConstraints[i];
        const c2 = temporalConstraints[j];

        const overlapStart = Math.max(c1.startTime, c2.startTime);
        const overlapEnd = Math.min(c1.endTime, c2.endTime);

        if (overlapStart < overlapEnd) {
          validationResult.isValid = false;
          break;
        }
      }
      if (!validationResult.isValid) break;
    }

    return validationResult;
  }
}