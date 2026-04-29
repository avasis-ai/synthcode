import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ConstraintType = "temporal" | "resource" | "capability" | "general";

export interface Constraint {
  type: ConstraintType;
  scope: "global" | "step" | "local";
  priority: number;
  description: string;
  validate: (action: any) => boolean;
  merge: (other: Constraint) => Constraint;
}

export interface ResolvedConstraints {
  constraints: Constraint[];
  mergedPayload: Record<string, any>;
}

export class ContextualConstraintResolver {
  private constraints: Constraint[];

  constructor(initialConstraints: Constraint[] = []) {
    this.constraints = initialConstraints;
  }

  public addConstraint(constraint: Constraint): this {
    this.constraints.push(constraint);
    return this;
  }

  private resolveConflicts(constraints: Constraint[]): Constraint[] {
    if (constraints.length === 0) {
      return [];
    }

    // Simple conflict resolution: Keep the highest priority constraint for each type/scope combination.
    const uniqueConstraintsMap = new Map<string, Constraint>();

    for (const constraint of constraints) {
      const key = `${constraint.type}:${constraint.scope}`;
      const existing = uniqueConstraintsMap.get(key);

      if (!existing || constraint.priority > existing.priority) {
        uniqueConstraintsMap.set(key, constraint);
      } else if (constraint.priority === existing.priority) {
        // If priorities are equal, we might need a more complex merge,
        // but for simplicity, we'll just keep the first one encountered or merge them if possible.
        // Here, we'll just overwrite to ensure the latest definition is considered if merge logic isn't explicit.
        uniqueConstraintsMap.set(key, constraint);
      }
    }

    return Array.from(uniqueConstraintsMap.values());
  }

  public resolve(rawConstraints: Constraint[]): ResolvedConstraints {
    const resolved = this.resolveConflicts(rawConstraints);

    // Merge payload: Collect all unique attributes from the resolved constraints
    const mergedPayload: Record<string, any> = {};
    for (const constraint of resolved) {
      if (constraint.type === "resource") {
        // Example of merging resource constraints into a payload map
        const resourceKey = `${constraint.type}:${constraint.scope}`;
        (mergedPayload as any)[resourceKey] = constraint.description;
      }
    }

    return {
      constraints: resolved,
      mergedPayload: mergedPayload,
    };
  }

  public validateAction(action: any, resolved: ResolvedConstraints): { isValid: boolean; mergedConstraints: Constraint[]; payload: Record<string, any> } {
    let allValid = true;
    const finalConstraints: Constraint[] = [];

    for (const constraint of resolved.constraints) {
      if (!constraint.validate(action)) {
        allValid = false;
        break;
      }
      finalConstraints.push(constraint);
    }

    return {
      isValid: allValid,
      mergedConstraints: finalConstraints,
      payload: resolved.mergedPayload,
    };
  }
}