import {
  SchemaMergeOptions,
  SchemaMergeReport,
  ToolInputSchemaMerger,
} from "./tool-input-schema-merger";

export class ToolInputSchemaMerger {
  private schemas: Record<string, any>[];
  private options: SchemaMergeOptions;

  constructor(schemas: Record<string, any>[], options: SchemaMergeOptions) {
    this.schemas = schemas;
    this.options = options;
  }

  mergeSchemas(): { mergedSchema: Record<string, any>; report: SchemaMergeReport } {
    const mergedSchema = this.merge(this.schemas);
    const report = this.generateReport(this.schemas, mergedSchema);
    return { mergedSchema, report };
  }

  private merge(schemas: Record<string, any>[]): Record<string, any> {
    if (schemas.length === 0) {
      return {} as Record<string, any>;
    }

    const merged: Record<string, any> = {};

    for (const schema of schemas) {
      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          const value = schema[key];
          if (Object.prototype.hasOwnProperty.call(merged, key)) {
            const existingValue = merged[key];
            merged[key] = this.resolveConflict(existingValue, value, key);
          } else {
            merged[key] = value;
          }
        }
      }
    }
    return merged;
  }

  private resolveConflict(existing: any, incoming: any, key: string): any {
    if (typeof existing !== 'object' || existing === null || typeof incoming !== 'object' || incoming === null) {
      return this.handlePrimitiveConflict(existing, incoming, key);
    }

    if (Array.isArray(existing) && Array.isArray(incoming)) {
      return this.mergeArrays(existing, incoming, key);
    }

    if (typeof existing === 'object' && typeof incoming === 'object') {
      const mergedObject: Record<string, any> = { ...existing };
      for (const innerKey in incoming) {
        if (Object.prototype.hasOwnProperty.call(incoming, innerKey)) {
          const incomingValue = (incoming as Record<string, any>)[innerKey];
          const existingValue = (existing as Record<string, any>)[innerKey];
          if (Object.prototype.hasOwnProperty.call(existing, innerKey)) {
            mergedObject[innerKey] = this.resolveConflict(existingValue, incomingValue, `${key}.${innerKey}`);
          } else {
            mergedObject[innerKey] = incomingValue;
          }
        }
      }
      return mergedObject;
    }

    return incoming; // Fallback
  }

  private handlePrimitiveConflict(existing: any, incoming: any, key: string): any {
    if (this.options.conflictResolution === 'STRICT') {
      if (existing !== incoming) {
        return { error: `Conflict on ${key}: Cannot merge ${typeof existing} (${JSON.stringify(existing)}) with ${typeof incoming} (${JSON.stringify(incoming)}).`; }
      }
      return existing;
    } else if (this.options.conflictResolution === 'LATEST') {
      return incoming;
    } else { // 'PREFER_EXISTING' or default
      return existing;
    }
  }

  private mergeArrays(existing: any[], incoming: any[], key: string): any[] {
    if (this.options.conflictResolution === 'STRICT') {
      if (existing.length !== incoming.length || existing.some((_, i) => !Object.is(existing[i], incoming[i]))) {
        return { error: `Conflict on array ${key}: Arrays differ in length or content.` };
      }
      return [...existing];
    }
    // Simple merge for arrays: combine unique elements or prefer incoming
    return [...new Set([...existing, ...incoming])];
  }

  private generateReport(schemas: Record<string, any>[], mergedSchema: Record<string, any>): SchemaMergeReport {
    const report: SchemaMergeReport = {
      merges: [],
      conflictsResolved: [],
      unresolvableIssues: [],
    };

    // Simplified reporting: In a real scenario, this would track changes key by key.
    // For this implementation, we just note the process.
    report.merges.push({
      source: "Multiple Sources",
      description: "Successfully merged schemas.",
      details: `Merged ${schemas.length} schemas into a single structure.`
    });

    if (this.options.conflictResolution === 'STRICT') {
      report.unresolvableIssues.push({
        source: "Conflict Check",
        issue: "Strict mode activated. Review all merged fields for potential type mismatches.",
        severity: "Warning"
      });
    }

    return report;
  }
}