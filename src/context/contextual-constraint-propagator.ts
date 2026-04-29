import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ConstraintType = "temporal" | "resource" | "schema";

export interface Constraint {
  type: ConstraintType;
  description: string;
  severity: "error" | "warning";
  details: Record<string, any>;
}

export interface Context {
  messages: Message[];
  constraints: Constraint[];
  state: Record<string, unknown>;
}

export interface Step {
  name: string;
  description: string;
  resolver: (context: Context, stepName: string) => Promise<Constraint[]>;
}

export class ContextualConstraintPropagator {
  private initialContext: Context;
  private steps: Step[];

  constructor(initialContext: Context, steps: Step[]) {
    this.initialContext = initialContext;
    this.steps = steps;
  }

  private mergeConstraints(existing: Constraint[], newConstraints: Constraint[]): Constraint[] {
    const combinedMap = new Map<string, Constraint>();

    const processConstraints = (constraints: Constraint[]) => {
      for (const constraint of constraints) {
        const key = `${constraint.type}:${constraint.description}`;
        if (!combinedMap.has(key) || constraint.severity === "error") {
          combinedMap.set(key, constraint);
        } else if (constraint.severity === "warning") {
          // Simple merging logic: keep the most severe constraint if types match
          const existingConstraint = combinedMap.get(key)!;
          if (existingConstraint.severity === "warning") {
            combinedMap.set(key, { ...existingConstraint, severity: "warning" });
          }
        }
      }
    };

    processConstraints(existing);
    processConstraints(newConstraints);

    return Array.from(combinedMap.values());
  }

  public async propagate(): Promise<Context> {
    let currentContext: Context = {
      messages: [...this.initialContext.messages],
      constraints: [...this.initialContext.constraints],
      state: { ...this.initialContext.state },
    };

    for (const step of this.steps) {
      try {
        const resolvedConstraints = await step.resolver(currentContext, step.name);
        
        const newConstraints = resolvedConstraints.filter(c => c);

        currentContext.constraints = this.mergeConstraints(
          currentContext.constraints,
          newConstraints
        );

        // In a real system, the step execution would update messages/state.
        // Here, we simulate context update by just logging the successful propagation.
        console.log(`Constraint propagation successful for step: ${step.name}. Constraints updated.`);

      } catch (error) {
        console.error(`Constraint propagation failed at step ${step.name}:`, error);
        // On failure, we might add an error constraint to the context
        currentContext.constraints.push({
          type: "schema",
          description: `Failed to process step ${step.name}`,
          severity: "error",
          details: { error: (error as Error).message || "Unknown error" }
        });
      }
    }

    return currentContext;
  }
}