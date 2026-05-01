import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Schema = Record<string, any>;

export enum ConflictResolutionStrategy {
  SemanticMerge = "semantic_merge",
  PreferLatest = "prefer_latest",
  CustomResolver = "custom_resolver",
}

export interface ConflictReport {
  field: string;
  conflicts: {
    source: string;
    value: any;
  }[];
  resolution: string;
}

export interface MergeReport {
  finalSchema: Schema;
  conflicts: ConflictReport[];
}

class SchemaMerger {
  private schemas: Schema[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: Schema[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema list cannot be empty.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveConflict(
    field: string,
    conflicts: { source: string; value: any }[]
  ): { resolvedValue: any; report: ConflictReport } {
    let resolvedValue: any = undefined;
    let report: ConflictReport = {
      field: field,
      conflicts: conflicts,
      resolution: "",
    };

    switch (this.strategy) {
      case ConflictResolutionStrategy.PreferLatest:
        const latestConflict = conflicts[conflicts.length - 1];
        resolvedValue = latestConflict.value;
        report.resolution = `Preferred value from the last schema (${latestConflict.source}).`;
        break;

      case ConflictResolutionStrategy.SemanticMerge:
        // Simplified semantic merge: if types are compatible (e.g., both are objects),
        // attempt a deep merge, otherwise, prefer the most complex type found.
        const firstValue = conflicts[0].value;
        const lastValue = conflicts[conflicts.length - 1].value;

        if (typeof firstValue === 'object' && firstValue !== null && typeof lastValue === 'object' && lastValue !== null) {
          try {
            // In a real scenario, this would be a deep merge utility.
            resolvedValue = { ...firstValue, ...lastValue };
            report.resolution = "Deep merged objects based on assumed compatibility.";
          } catch (e) {
            resolvedValue = lastValue;
            report.resolution = "Semantic merge failed, falling back to preferring the last value.";
          }
        } else {
          resolvedValue = lastValue;
          report.resolution = "Semantic merge not applicable (non-object types), preferring the last value.";
        }
        break;

      case ConflictResolutionStrategy.CustomResolver:
        // Placeholder for complex business logic resolution
        resolvedValue = conflicts.reduce((acc, conflict) => {
          if (typeof acc === 'object' && acc !== null && typeof conflict.value === 'object' && conflict.value !== null) {
            return { ...acc, ...conflict.value };
          }
          return conflict.value;
        }, null);
        report.resolution = "Applied custom resolver logic (e.g., union of all properties).";
        break;
    }

    return { resolvedValue, report };
  }

  public merge(): MergeReport {
    const finalSchema: Schema = {};
    const conflictReports: ConflictReport[] = [];

    for (const key in this.schemas[0] || {}) {
      if (!Object.prototype.hasOwnProperty.call(this.schemas[0] || {}, key)) continue;

      const conflicts: { source: string; value: any }[] = [];
      for (let i = 0; i < this.schemas.length; i++) {
        const schema = this.schemas[i];
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          conflicts.push({
            source: `Schema ${i}`,
            value: schema[key],
          });
        }
      }

      if (conflicts.length > 0) {
        const { resolvedValue, report } = this.resolveConflict(key, conflicts);
        finalSchema[key] = resolvedValue;
        conflictReports.push(report);
      }
    }

    return {
      finalSchema: finalSchema,
      conflicts: conflictReports,
    };
  }
}

export { SchemaMerger, ConflictResolutionStrategy, MergeReport, ConflictReport };