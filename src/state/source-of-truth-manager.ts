import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type SourceId = string;

interface StateUpdate {
  sourceId: SourceId;
  timestamp: number;
  data: Record<string, unknown>;
  authorityScore: number;
}

type ConflictResolutionStrategy = "AuthorityWins" | "RecencyWins" | "WeightedMerge";

export class SourceOfTruthManager {
  private currentState: Record<string, unknown>;

  constructor(initialState: Record<string, unknown> = {}) {
    this.currentState = initialState;
  }

  public getCurrentState(): Record<string, unknown> {
    return { ...this.currentState };
  }

  public reconcile(
    updates: StateUpdate[],
    strategy: ConflictResolutionStrategy
  ): Record<string, unknown> {
    if (!updates || updates.length === 0) {
      return this.currentState;
    }

    let resolvedState: Record<string, unknown> = { ...this.currentState };

    switch (strategy) {
      case "AuthorityWins":
        resolvedState = this.applyAuthorityWins(updates, resolvedState);
        break;
      case "RecencyWins":
        resolvedState = this.applyRecencyWins(updates, resolvedState);
        break;
      case "WeightedMerge":
        resolvedState = this.applyWeightedMerge(updates, resolvedState);
        break;
    }

    this.currentState = resolvedState;
    return resolvedState;
  }

  private applyAuthorityWins(updates: StateUpdate[], currentState: Record<string, unknown>): Record<string, unknown> {
    const sortedUpdates = [...updates].sort((a, b) => b.authorityScore - a.authorityScore);
    let newState = { ...currentState };

    for (const update of sortedUpdates) {
      for (const key in update.data) {
        if (typeof update.data[key] !== 'undefined') {
          newState[key] = update.data[key];
        }
      }
    }
    return newState;
  }

  private applyRecencyWins(updates: StateUpdate[], currentState: Record<string, unknown>): Record<string, unknown> {
    const sortedUpdates = [...updates].sort((a, b) => b.timestamp - a.timestamp);
    let newState = { ...currentState };

    for (const update of sortedUpdates) {
      for (const key in update.data) {
        if (typeof update.data[key] !== 'undefined') {
          newState[key] = update.data[key];
        }
      }
    }
    return newState;
  }

  private applyWeightedMerge(updates: StateUpdate[], currentState: Record<string, unknown>): Record<string, unknown> {
    let mergedState: Record<string, unknown> = { ...currentState };

    for (const update of updates) {
      for (const key in update.data) {
        const newValue = update.data[key];
        const existingValue = mergedState[key];

        if (existingValue === undefined) {
          mergedState[key] = newValue;
        } else {
          // Simple merge logic: if the new value is a complex object, we might merge properties.
          // For simplicity, we prioritize the update if its authority score is higher than the current state's implicit authority.
          // Since we don't track per-key authority, we'll use a simple overwrite unless the types mismatch significantly.
          if (typeof newValue === 'object' && newValue !== null && typeof existingValue === 'object' && existingValue !== null) {
            // Placeholder for deep merge logic
            mergedState[key] = { ...existingValue, ...newValue } as unknown as unknown;
          } else {
            mergedState[key] = newValue;
          }
        }
      }
    }
    return mergedState;
  }
}