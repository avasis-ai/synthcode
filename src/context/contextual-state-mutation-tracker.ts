import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type ContextState = Record<string, any>;

type MutationType = "SET" | "INCREMENT" | "DELETE";

export interface MutationIntent {
  targetPath: string;
  type: MutationType;
  expectedValue?: any;
  source: string;
}

export class MutationTracker {
  private currentState: ContextState;
  private intents: MutationIntent[];

  constructor(initialState: ContextState) {
    this.currentState = initialState;
    this.intents = [];
  }

  addIntent(intent: MutationIntent): this {
    this.intents.push(intent);
    return this;
  }

  private validateIntent(intent: MutationIntent, state: ContextState): boolean {
    const { targetPath, type, expectedValue, source } = intent;

    if (!targetPath || !type || !source) {
      return false;
    }

    if (type === "SET") {
      // Basic check: If we are setting, we assume the value is valid for now.
      // More complex validation would require schema knowledge.
      return true;
    }

    if (type === "INCREMENT") {
      const currentValue = this.getDeepValue(state, targetPath);
      if (typeof currentValue !== "number") {
        return false;
      }
      return true;
    }

    if (type === "DELETE") {
      // Deletion is generally safe if the path exists or doesn't matter.
      return true;
    }

    return false;
  }

  private getDeepValue(obj: ContextState, path: string): any {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  public planMutation(): {
    plan: MutationIntent[];
    rollbackPlan: MutationIntent[];
  } {
    const plan: MutationIntent[] = [];
    const rollbackPlan: MutationIntent[] = [];
    let tempState: ContextState = { ...this.currentState };

    for (const intent of this.intents) {
      if (!this.validateIntent(intent, tempState)) {
        throw new Error(`Conflict detected: Invalid intent from ${intent.source} for path ${intent.targetPath} with type ${intent.type}.`);
      }

      // Simulate application of the mutation to check for conflicts with subsequent intents
      let nextState: ContextState = { ...tempState };
      let applied = false;

      if (intent.type === "SET") {
        nextState = { ...nextState, [intent.targetPath]: intent.expectedValue };
        applied = true;
      } else if (intent.type === "INCREMENT") {
        const current = this.getDeepValue(tempState, intent.targetPath) || 0;
        nextState = { ...nextState, [intent.targetPath]: current + 1 };
        applied = true;
      } else if (intent.type === "DELETE") {
        // Simple deletion simulation
        const keys = Object.keys(tempState);
        for (const key of keys) {
            if (key.startsWith(intent.targetPath)) {
                delete nextState[key];
            }
        }
        applied = true;
      }

      // Conflict Check 2: Check if the *next* state violates the *next* intent's assumptions
      // (This is simplified; a real system would check the full sequence)

      plan.push(intent);
      rollbackPlan.push(this.generateRollback(intent, tempState));
      tempState = nextState;
    }

    return { plan, rollbackPlan };
  }

  private generateRollback(intent: MutationIntent, previousState: ContextState): MutationIntent {
    switch (intent.type) {
      case "SET":
        // To undo SET, we need the value *before* the set, which is complex.
        // For simplicity, we assume rollback means reverting to the state before this intent.
        // A true rollback would require storing the *old* value in the intent itself.
        return {
          targetPath: intent.targetPath,
          type: "SET",
          expectedValue: this.getDeepValue(previousState, intent.targetPath),
          source: "ROLLBACK",
        };
      case "INCREMENT":
        // To undo INCREMENT, we DECREMENT.
        return {
          targetPath: intent.targetPath,
          type: "INCREMENT", // Reusing INCREMENT type for decrement logic
          expectedValue: -1, // Signal decrement
          source: "ROLLBACK",
        };
      case "DELETE":
        // To undo DELETE, we need the deleted value. Assuming we can't recover it,
        // we might mark it as 'RECREATE' or fail. Here, we'll just mark it.
        return {
          targetPath: intent.targetPath,
          type: "SET",
          expectedValue: undefined, // Placeholder for missing data
          source: "ROLLBACK",
        };
    }
  }

  public rollback(rollbackPlan: MutationIntent[]): ContextState {
    let currentState: ContextState = { ...this.currentState };

    for (const intent of rollbackPlan) {
      if (intent.source === "ROLLBACK") {
        if (intent.type === "INCREMENT" && intent.expectedValue === -1) {
          const currentValue = this.getDeepValue(currentState, intent.targetPath) || 0;
          currentState = { ...currentState, [intent.targetPath]: currentValue - 1 };
        } else if (intent.type === "SET") {
          const valueToSet = intent.expectedValue;
          if (valueToSet !== undefined) {
            // Simple path setting simulation
            let temp: Record<string, any> = { ...currentState };
            let current = temp;
            const parts = intent.targetPath.split(".");
            for (let i = 0; i < parts.length - 1; i++) {
                current = current[parts[i]] = {};
            }
            current[parts[parts.length - 1]] = valueToSet;
            currentState = { ...currentState, ...temp };
          }
        }
      }
    }
    return currentState;
  }
}