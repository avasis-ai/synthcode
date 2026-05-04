import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SemanticDiffReport {
  changedEntities: Record<string, { path: string; oldValue: unknown; newValue: unknown; description: string }>;
  changedRelationships: Record<string, { source: string; target: string; oldValue: unknown; newValue: unknown; description: string }>;
  structuralChanges: string[];
  isSemanticallyDifferent: boolean;
}

export interface SemanticIgnoreRules {
  ignoreFields: string[];
  ignoreKeys: string[];
  timestampKeys: string[];
}

export class ContextualStateDiffer {
  private rules: SemanticIgnoreRules;

  constructor(rules: SemanticIgnoreRules) {
    this.rules = rules;
  }

  private isIgnored(key: string): boolean {
    return this.rules.ignoreFields.includes(key) || this.rules.ignoreKeys.includes(key);
  }

  private deepCompare(a: unknown, b: unknown): { changed: boolean; diff: unknown } {
    if (typeof a !== typeof b) {
      return { changed: true, diff: { type: "type_mismatch", expected: typeof b, actual: typeof a } };
    }

    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      const keysA = Object.keys(a) as string[];
      const keysB = Object.keys(b) as string[];
      const allKeys = new Set([...keysA, ...keysB]);

      const diff: Record<string, any> = {};
      let changed = false;

      for (const key of allKeys) {
        if (this.isIgnored(key)) continue;

        const valA = (a as Record<string, unknown>)[key];
        const valB = (b as Record<string, unknown>)[key];

        if (key !== 'context' && key !== 'history') {
          if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
            const nestedDiff = this.deepCompare(valA, valB);
            if (nestedDiff.changed) {
              diff[key] = nestedDiff.diff;
              changed = true;
            } else {
              diff[key] = valA; // Keep structure for context
            }
          } else if (valA !== valB) {
            diff[key] = { type: "value_change", oldValue: valA, newValue: valB };
            changed = true;
          } else {
            diff[key] = valA;
          }
        }
      }
      return { changed: changed, diff: diff };
    }

    if (a !== b) {
      return { changed: true, diff: { type: "value_change", oldValue: a, newValue: b } };
    }

    return { changed: false, diff: a };
  }

  public diffContext(
    oldContext: { context: unknown; history: Message[] },
    newContext: { context: unknown; history: Message[] }
  ): SemanticDiffReport {
    const report: SemanticDiffReport = {
      changedEntities: {},
      changedRelationships: {},
      structuralChanges: [],
      isSemanticallyDifferent: false,
    };

    // 1. Context Payload Diffing (Assuming 'context' is the primary structured data)
    const contextDiff = this.deepCompare(oldContext.context, newContext.context);

    if (contextDiff.changed) {
      report.isSemanticallyDifferent = true;
      // Simplified entity/relationship extraction for demonstration
      if (typeof contextDiff.diff === 'object' && contextDiff.diff !== null) {
        Object.keys(contextDiff.diff).forEach(key => {
          const diffValue = (contextDiff.diff as Record<string, any>)[key];
          if (diffValue && typeof diffValue === 'object' && 'type' in diffValue && diffValue.type === 'value_change') {
            report.changedEntities[`context.${key}`] = {
              path: `context.${key}`,
              oldValue: diffValue.oldValue,
              newValue: diffValue.newValue,
              description: `Value changed for key ${key}.`,
            };
          }
        });
      }
    }

    // 2. History Diffing (Message comparison)
    const oldHistory = oldContext.history;
    const newHistory = newContext.history;

    if (oldHistory.length !== newHistory.length) {
      report.structuralChanges.push(`History length changed from ${oldHistory.length} to ${newHistory.length}.`);
      report.isSemanticallyDifferent = true;
    } else {
      for (let i = 0; i < newHistory.length; i++) {
        const oldMsg = oldHistory[i];
        const newMsg = newHistory[i];

        if (oldMsg && newMsg) {
          // Simple comparison for message content structure
          const msgDiff = this.deepCompare(oldMsg, newMsg);
          if (msgDiff.changed) {
            report.structuralChanges.push(`Message at index ${i} changed.`);
            report.isSemanticallyDifferent = true;
          }
        }
      }
    }

    // 3. Final determination
    if (report.structuralChanges.length === 0 && Object.keys(report.changedEntities).length === 0) {
      report.isSemanticallyDifferent = false;
    }

    return report;
  }
}