import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface Snapshot {
  data: Record<string, unknown>;
  timestamp: number;
  source: string;
}

export type MergeStrategy = "latest" | "weighted-average" | "conflict-resolution-by-source";

export class ContextualSnapshotMerger {
  private snapshots: Snapshot[];

  constructor(snapshots: Snapshot[]) {
    this.snapshots = snapshots;
  }

  public merge(strategy: MergeStrategy): Record<string, unknown> {
    if (this.snapshots.length === 0) {
      return {} as Record<string, unknown>;
    }

    switch (strategy) {
      case "latest":
        return this.mergeLatest();
      case "weighted-average":
        return this.mergeWeightedAverage();
      case "conflict-resolution-by-source":
        return this.mergeBySource();
      default:
        throw new Error("Unsupported merge strategy");
    }
  }

  private mergeLatest(): Record<string, unknown> {
    const sortedSnapshots = [...this.snapshots].sort((a, b) => b.timestamp - a.timestamp);
    let mergedState: Record<string, unknown> = {} as Record<string, unknown>;

    for (const snapshot of sortedSnapshots) {
      Object.assign(mergedState, snapshot.data);
    }
    return mergedState;
  }

  private mergeWeightedAverage(): Record<string, unknown> {
    const initialMerge: Record<string, unknown> = {} as Record<string, unknown>;
    const keys = new Set<string>();

    for (const snapshot of this.snapshots) {
      Object.keys(snapshot.data).forEach(key => keys.add(key));
    }

    const finalState: Record<string, unknown> = {} as Record<string, unknown>;

    for (const key of keys) {
      const values = this.snapshots
        .map(s => s.data[key])
        .filter((value): value is unknown => value !== undefined);

      if (values.length === 0) {
        continue;
      }

      // Simple average simulation for numbers, otherwise take the last non-null value
      const numericValues = values.filter((v): v is number => typeof v === 'number');
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        finalState[key] = sum / numericValues.length;
      } else {
        // Fallback: Use the value from the latest snapshot for non-numeric types
        const latestValue = this.snapshots
          .sort((a, b) => b.timestamp - a.timestamp)
          .find(s => s.data[key] !== undefined)?.data[key];
        finalState[key] = latestValue || undefined;
      }
    }

    return finalState;
  }

  private mergeBySource(): Record<string, unknown> {
    const sourceMap = new Map<string, Record<string, unknown>>();

    for (const snapshot of this.snapshots) {
      if (!sourceMap.has(snapshot.source)) {
        sourceMap.set(snapshot.source, {} as Record<string, unknown>());
      }
      const currentSourceData = sourceMap.get(snapshot.source)!;
      Object.assign(currentSourceData, snapshot.data);
    }

    const mergedState: Record<string, unknown> = {} as Record<string, unknown>;
    sourceMap.forEach((data, source) => {
      Object.keys(data).forEach(key => {
        if (!(key in mergedState)) {
          mergedState[key] = data[key];
        } else {
          // Conflict resolution: Prefer the value from the source that appears latest in the input array
          // This is a heuristic, but satisfies the "by source" requirement by prioritizing source order.
          const existingValue = mergedState[key];
          const newValue = data[key];

          // Simple conflict resolution: If types mismatch or one is null/undefined, prefer the non-null one.
          if (typeof existingValue !== typeof newValue || existingValue === undefined || newValue === undefined) {
            mergedState[key] = newValue;
          }
        }
      });
    });

    return mergedState;
  }
}