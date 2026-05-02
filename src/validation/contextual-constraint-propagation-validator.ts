import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Constraint = {
  key: string;
  value: any;
  scope: "global" | "local";
};

export interface ContextUpdate {
  context: Record<string, unknown>;
  newConstraints: Constraint[];
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
}

export class ContextualConstraintPropagationValidator {
  private initialContext: Record<string, unknown>;
  private observedConstraints: Constraint[] = [];

  constructor(initialContext: Record<string, unknown>) {
    this.initialContext = initialContext;
  }

  private propagateConstraints(
    currentConstraints: Constraint[],
    newConstraints: Constraint[]
  ): {
    propagated: Constraint[];
    violations: string[];
  } {
    const propagated: Constraint[] = [...currentConstraints];
    const violations: string[]: string[] = [];

    for (const newConstraint of newConstraints) {
      for (const existingConstraint of propagated) {
        if (this.areConflicting(existingConstraint, newConstraint)) {
          violations.push(
            `Conflict detected: Constraint '${existingConstraint.key}' (${existingConstraint.value}) conflicts with new constraint '${newConstraint.key}' (${newConstraint.value}).`
          );
        }
      }
      // Simple propagation rule: Union of constraints, favoring the new one if keys match and scope is global
      if (newConstraint.scope === "global" && existingConstraint.scope === "global" && existingConstraint.key === newConstraint.key) {
        // In a real scenario, this would involve complex merging logic. Here, we just overwrite for simplicity.
        const index = propagated.indexOf(existingConstraint);
        if (index !== -1) {
          propagated[index] = newConstraint;
        }
      } else {
        propagated.push(newConstraint);
      }
    }

    return { propagated, violations };
  }

  private areConflicting(c1: Constraint, c2: Constraint): boolean {
    if (c1.key === c2.key && c1.scope === "global" && c2.scope === "global") {
      // Example conflict: If both define a required value, but they are different.
      return c1.value !== c2.value;
    }
    // Add more complex conflict logic here (e.g., temporal range overlap checks)
    return false;
  }

  public validate(
    updates: ContextUpdate[]
  ): ValidationResult {
    let currentConstraints: Constraint[] = [];
    const allViolations: string[] = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const { propagated, violations } = this.propagateConstraints(
        currentConstraints,
        update.newConstraints
      );

      if (violations.length > 0) {
        allViolations.push(
          `Step ${i + 1} Violations: ${violations.join('; ')}`
        );
      }

      currentConstraints = propagated;
    }

    const isValid: boolean = allViolations.length === 0;

    return {
      isValid,
      violations: allViolations,
    };
  }
}