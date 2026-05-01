import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContextGraph {
  [key: string]: {
    relatedFields: string[];
    semanticWeight: number;
  };
}

export interface SemanticDiffReport {
  diffs: {
    path: string;
    oldValue: unknown;
    newValue: unknown;
    isSemanticDrift: boolean;
    driftReason?: string;
  }[];
  hasDrift: boolean;
}

interface StatePayload {
  [key: string]: unknown;
}

class SemanticDiffCalculator {
  private contextGraph: ContextGraph;

  constructor(contextGraph: ContextGraph) {
    this.contextGraph = contextGraph;
  }

  private calculateSimpleDiff(oldState: StatePayload, newState: StatePayload): {
    diffs: {
      path: string;
      oldValue: unknown;
      newValue: unknown;
      isSemanticDrift: boolean;
      driftReason?: string;
    }[];
    hasDrift: boolean;
  } {
    const diffs: {
      path: string;
      oldValue: unknown;
      newValue: unknown;
      isSemanticDrift: boolean;
      driftReason?: string;
    }[] = [];

    const findDiffs = (path: string, oldObj: unknown, newObj: unknown) => {
      if (typeof oldObj !== 'object' || oldObj === null || typeof newObj !== 'object' || newObj === null) {
        if (oldObj !== newObj) {
          diffs.push({
            path,
            oldValue: oldObj,
            newValue: newObj,
            isSemanticDrift: false,
          });
        }
        return;
      }

      const oldKeys = Object.keys(oldObj) as string[];
      const newKeys = Object.keys(newObj) as string[];
      const allKeys = new Set([...oldKeys, ...newKeys]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const oldValue = (oldObj as Record<string, unknown>)[key];
        const newValue = (newObj as Record<string, unknown>)[key];

        if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
          findDiffs(currentPath, oldValue, newValue);
        } else if (oldValue !== newValue) {
          diffs.push({
            path: currentPath,
            oldValue: oldValue,
            newValue: newValue,
            isSemanticDrift: false,
          });
        }
      }
    };

    findDiffs("", oldState, newState);

    return { diffs, hasDrift: diffs.length > 0 };
  }

  public calculate(oldState: StatePayload, newState: StatePayload): SemanticDiffReport {
    const simpleDiff = this.calculateSimpleDiff(oldState, newState);
    const finalDiffs: {
      path: string;
      oldValue: unknown;
      newValue: unknown;
      isSemanticDrift: boolean;
      driftReason?: string;
    }[] = [];

    // Step 1: Collect simple diffs
    for (const diff of simpleDiff.diffs) {
      finalDiffs.push(diff);
    }

    // Step 2: Incorporate semantic context awareness
    const semanticDriftChecks: {
      path: string;
      oldValue: unknown;
      newValue: unknown;
      isSemanticDrift: boolean;
      driftReason?: string;
    }[] = [];

    for (const key in this.contextGraph) {
      const context = this.contextGraph[key];
      const relatedFields = context.relatedFields;

      // Check if the key itself is in the state and if there are related fields
      if (relatedFields.length > 0 && (oldState as any)[key] !== undefined && (newState as any)[key] !== undefined) {
        const oldVal = (oldState as any)[key];
        const newVal = (newState as any)[key];

        // Simplified semantic check: If related fields exist, and the value changes,
        // we assume potential drift if the change is significant (e.g., type change or major value shift)
        // For this implementation, we simulate drift detection based on context weight and change.
        if (oldVal !== newVal) {
          let isDrift = false;
          let reason: string | undefined = undefined;

          // Simulate semantic drift detection: If the context weight is high, and the value changes,
          // we flag it as potential drift, even if the raw change is minor.
          if (context.semanticWeight > 0.7) {
            isDrift = true;
            reason = `High semantic weight (${context.semanticWeight.toFixed(2)}) suggests conceptual drift between '${relatedFields.join(', ')}'.`;
          }

          semanticDriftChecks.push({
            path: key,
            oldValue: oldVal,
            newValue: newVal,
            isSemanticDrift: isDrift,
            driftReason: reason,
          });
        }
      }
    }

    // Merge and prioritize semantic findings (overwriting simple diffs if necessary, or augmenting them)
    const finalMap = new Map<string, any>();
    finalDiffs.forEach(d => finalMap.set(d.path, d));

    semanticDriftChecks.forEach(s => {
      const existing = finalMap.get(s.path);
      if (existing) {
        // Augment the existing diff with semantic information if it was flagged
        finalMap.set(s.path, {
          ...existing,
          isSemanticDrift: s.isSemanticDrift || existing.isSemanticDrift,
          driftReason: s.driftReason || existing.driftReason,
        });
      } else {
        // Add the semantic diff if it wasn't caught by simple diffing (e.g., complex object structure changes)
        finalMap.set(s.path, {
          path: s.path,
          oldValue: s.oldValue,
          newValue: s.newValue,
          isSemanticDrift: s.isSemanticDrift,
          driftReason: s.driftReason,
        });
      }
    });

    const finalReportDiffs = Array.from(finalMap.values());
    const hasDrift = finalReportDiffs.some(d => d.isSemanticDrift);

    return {
      diffs: finalReportDiffs,
      hasDrift: hasDrift,
    };
  }
}

export class ContextualStateDiffer {
  private contextGraph: ContextGraph;

  constructor(contextGraph: ContextGraph) {
    this.contextGraph = contextGraph;
  }

  public calculateSemanticDiff(oldState: StatePayload, newState: StatePayload): SemanticDiffReport {
    const calculator = new SemanticDiffCalculator(this.contextGraph);
    return calculator.calculate(oldState, newState);
  }
}