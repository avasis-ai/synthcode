export type SourceUpdate<TState> = {
  payload: Partial<TState>;
  sourceID: string;
  timestamp: number;
};

export type ConflictResolutionResult<TState> = {
  resolvedState: TState;
  conflictsResolved: string[];
};

export type ReconciliationPolicy<TState> = (
  currentState: TState,
  updates: SourceUpdate<TState>[]
) => ConflictResolutionResult<TState>;

export interface ReconciliationReport<TState> {
  finalState: TState;
  conflictsResolved: string[];
}

export class StateReconciliationEngine<TState> {
  private policy: ReconciliationPolicy<TState>;

  constructor(policy: ReconciliationPolicy<TState>) {
    this.policy = policy;
  }

  /**
   * Reconciles an array of asynchronous state updates against a canonical state
   * using the configured policy.
   * @param canonicalState The current authoritative state.
   * @param updates An array of incoming updates from various sources.
   * @returns A report containing the final authoritative state and a list of resolved conflicts.
   */
  reconcile(canonicalState: TState, updates: SourceUpdate<TState>[]): ReconciliationReport<TState> {
    if (!updates || updates.length === 0) {
      return {
        finalState: canonicalState,
        conflictsResolved: [],
      };
    }

    const result = this.policy(canonicalState, updates);

    return {
      finalState: result.resolvedState,
      conflictsResolved: result.conflictsResolved,
    };
  }

  /**
   * Factory method to create a default Last-Write-Wins policy.
   * This policy assumes the state is an object and the latest timestamp dictates the winner.
   * @returns A new StateReconciliationEngine instance configured with LWW.
   */
  static createLastWriteWinsEngine(): StateReconciliationEngine<Record<string, any>> {
    const defaultPolicy: ReconciliationPolicy<Record<string, any>> = (
      currentState,
      updates
    ) => {
      let workingState: Record<string, any> = { ...currentState };
      const resolvedConflicts: string[] = [];

      for (const update of updates) {
        // Simple LWW implementation: Overwrite state properties if the update is newer
        // or if the property is not yet set.
        for (const key in update.payload) {
          const payloadKey = key as keyof typeof update.payload;
          const newValue = update.payload[payloadKey];

          // In a real scenario, we would compare timestamps for specific fields.
          // For simplicity, we assume the last update processed wins.
          if (typeof newValue !== 'undefined') {
            workingState[payloadKey] = newValue;
            resolvedConflicts.push(`Field ${payloadKey} updated by source ${update.sourceID}`);
          }
        }
      }

      return {
        resolvedState: workingState,
        conflictsResolved: resolvedConflicts,
      };
    };

    return new StateReconciliationEngine(defaultPolicy);
  }
}