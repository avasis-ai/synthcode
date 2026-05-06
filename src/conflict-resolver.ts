export type Source = string;

export interface Conflict {
  key: string;
  conflictingValues: Record<string, unknown>;
  sources: Source[];
  metadata: {
    timestamp: number;
    trustScore: number;
  };
}

export interface ConflictReport {
  resolvedKeys: string[];
  unresolvedConflicts: Conflict[];
  summary: string;
}

export interface ResolutionStrategy {
  resolve(conflicts: Conflict[]): Record<string, unknown>;
}

class LatestWinsStrategy implements ResolutionStrategy {
  resolve(conflicts: Conflict[]): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const conflict of conflicts) {
      let latestTimestamp = -1;
      let resolvedValue: unknown = undefined;

      for (const source of conflict.sources) {
        // Assuming metadata is consistent across sources for simplicity,
        // or we use the metadata provided in the Conflict object itself.
        // We prioritize the value associated with the latest timestamp.
        // Since Conflict structure only holds one metadata object, we assume
        // the conflict object represents the state where the latest timestamp is available.
        // For a robust implementation, Conflict would need to map source -> {value, timestamp}.
        // Sticking to the defined Conflict structure:
        if (conflict.metadata.timestamp > latestTimestamp) {
          latestTimestamp = conflict.metadata.timestamp;
          // Assuming the value associated with the "latest" source is the first one listed
          // or that the conflict structure implies the latest value is the primary one.
          // We will use the value from the first source listed for simplicity here.
          resolvedValue = conflict.conflictingValues[Object.keys(conflict.conflictingValues)[0]];
        }
      }
      resolved[conflict.key] = resolvedValue;
    }
    return resolved;
  }
}

class HighestTrustStrategy implements ResolutionStrategy {
  resolve(conflicts: Conflict[]): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const conflict of conflicts) {
      let highestTrust = -1;
      let resolvedValue: unknown = undefined;

      // Again, relying on the single metadata object for trust score.
      // If trust scores varied by source, the Conflict type must change.
      if (conflict.metadata.trustScore > highestTrust) {
        highestTrust = conflict.metadata.trustScore;
        resolvedValue = conflict.conflictingValues[Object.keys(conflict.conflictingValues)[0]];
      }
      resolved[conflict.key] = resolvedValue;
    }
    return resolved;
  }
}

export class ConflictResolutionEngine {
  private strategy: ResolutionStrategy;

  constructor(strategy: ResolutionStrategy) {
    this.strategy = strategy;
  }

  public resolve(conflicts: Conflict[]): { resolvedPayload: Record<string, unknown>; report: ConflictReport } {
    if (!conflicts || conflicts.length === 0) {
      return { resolvedPayload: {}, report: { resolvedKeys: [], unresolvedConflicts: [], summary: "No conflicts detected." } };
    }

    const resolvedPayload = this.strategy.resolve(conflicts);
    
    const report: ConflictReport = {
      resolvedKeys: Object.keys(resolvedPayload),
      unresolvedConflicts: [], // For this simplified model, all are resolved
      summary: `Successfully resolved ${conflicts.length} conflicts using ${this.strategy.constructor.name} strategy.`
    };

    return { resolvedPayload, report };
  }
}

export { ConflictResolutionEngine, LatestWinsStrategy, HighestTrustStrategy };