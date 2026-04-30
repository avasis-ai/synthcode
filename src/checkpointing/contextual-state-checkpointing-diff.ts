import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StateDiffCalculator {
  calculateDiff(currentState: Record<string, any>, previousState: Record<string, any>): Record<string, any>;
}

export interface StateDiffApplier {
  applyDiff(previousState: Record<string, any>, diff: Record<string, any>): Record<string, any>;
}

export class ContextualStateCheckpointManager {
  private readonly diffCalculator: StateDiffCalculator;
  private readonly checkpointManager: {
    saveDiff: (diff: Record<string, any>, metadata: Record<string, any>) => Promise<string>;
    loadDiff: (checkpointId: string): Promise<{ diff: Record<string, any>; metadata: Record<string, any> }>;
  };

  constructor(
    diffCalculator: StateDiffCalculator,
    checkpointManager: {
      saveDiff: (diff: Record<string, any>, metadata: Record<string, any>) => Promise<string>;
      loadDiff: (checkpointId: string): Promise<{ diff: Record<string, any>; metadata: Record<string, any> }>;
    }
  ) {
    this.diffCalculator = diffCalculator;
    this.checkpointManager = checkpointManager;
  }

  async checkpointState(currentState: Record<string, any>, metadata: Record<string, any>): Promise<string> {
    const diff = this.diffCalculator.calculateDiff(currentState, currentState); // Simplified: In a real scenario, we'd pass the *previous* state here. Assuming the caller handles the previous state context.
    return this.checkpointManager.saveDiff(diff, metadata);
  }

  async restoreState(checkpointId: string): Promise<Record<string, any>> {
    const { diff, metadata } = await this.checkpointManager.loadDiff(checkpointId);
    // For restoration, we need the *last known good state* to apply the diff against.
    // Since this method signature is limited, we assume the caller provides the base state.
    // For demonstration, we'll assume the base state is passed or derived.
    throw new Error("restoreState requires the base state to apply the diff.");
  }
}

export class SimpleStateDiffCalculator implements StateDiffCalculator {
  calculateDiff(currentState: Record<string, any>, previousState: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(currentState), ...Object.keys(previousState)]);

    for (const key of keys) {
      const current = currentState[key];
      const previous = previousState[key];

      if (current === undefined && previous === undefined) continue;

      if (typeof current !== typeof previous) {
        diff[key] = { removed: true, type: "type_change" };
        continue;
      }

      if (JSON.stringify(current) !== JSON.stringify(previous)) {
        diff[key] = {
          added: current,
          removed: previous,
          changed: true,
        };
      }
    }
    return diff;
  }
}

export class SimpleStateDiffApplier implements StateDiffApplier {
  applyDiff(previousState: Record<string, any>, diff: Record<string, any>): Record<string, any> {
    const newState: Record<string, any> = { ...previousState };

    for (const key in diff) {
      const diffPayload = diff[key];

      if (diffPayload.removed !== undefined && diffPayload.removed !== null) {
        // Handle removal (if the diff structure implies removal)
        delete newState[key];
      } else if (diffPayload.added !== undefined && diffPayload.added !== null) {
        // Handle addition or update
        newState[key] = diffPayload.added;
      } else if (diffPayload.changed === true) {
        // If only 'changed' flag is present, assume the 'added' value is the new state
        newState[key] = diffPayload.added;
      }
    }
    return newState;
  }
}

export {
  ContextualStateCheckpointManager,
  SimpleStateDiffCalculator,
  SimpleStateDiffApplier,
  StateDiffCalculator,
  StateDiffApplier
}