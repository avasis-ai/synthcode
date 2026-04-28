import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDriftReport {
  baselineSchema: any;
  history: {
    observedSchema: any;
    driftDetails: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[];
  };
  summary: {
    totalDrifts: number;
    driftDetails: Record<string, {
      description: string;
      count: number;
      examples: string[];
    }>;
  };
}

export class StructuredToolOutputSchemaEvolutionMonitor {
  private baselineSchema: any;
  private history: {
    observedSchema: any;
    driftDetails: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[];
  }[] = [];

  constructor(baselineSchema: any) {
    this.baselineSchema = baselineSchema;
  }

  private compareSchemas(observedSchema: any, baseline: any): {
    field: string;
    change: string;
    count: number;
    observedTypes: string[];
  }[] {
    const drifts: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[] = [];

    const baselineKeys = Object.keys(baseline);
    const observedKeys = Object.keys(observedSchema);

    // Check for changes or removals compared to baseline
    for (const key of baselineKeys) {
      if (!(key in observedSchema)) {
        drifts.push({
          field: key,
          change: "REMOVED",
          count: 1,
          observedTypes: [],
        });
        continue;
      }

      const observedValue = observedSchema[key];
      const baselineValue = baseline[key];

      if (typeof observedValue !== typeof baselineValue) {
        drifts.push({
          field: key,
          change: `TYPE_CHANGE: ${typeof baselineValue} -> ${typeof observedValue}`,
          count: 1,
          observedTypes: [typeof observedValue],
        });
      } else if (typeof observedValue === 'object' && observedValue !== null && typeof baselineValue === 'object' && baselineValue !== null) {
        // Simple check for object structure change (deep comparison omitted for brevity, focusing on top-level drift)
        if (Object.keys(observedValue).length !== Object.keys(baselineValue).length) {
          drifts.push({
            field: key,
            change: `STRUCTURE_CHANGE: Key count changed from ${Object.keys(baselineValue).length} to ${Object.keys(observedValue).length}`,
            count: 1,
            observedTypes: [],
          });
        }
      }
    }

    // Check for additions compared to baseline
    for (const key of observedKeys) {
      if (!(key in baseline)) {
        drifts.push({
          field: key,
          change: "ADDED",
          count: 1,
          observedTypes: [],
        });
      }
    }

    return drifts;
  }

  private compareAgainstHistory(observedSchema: any): {
    field: string;
    change: string;
    count: number;
    observedTypes: string[];
  }[] {
    const historyDrifts: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[] = [];

    const observedKeys = Object.keys(observedSchema);
    const historicalKeys = new Set<string>();

    for (const key of observedKeys) {
      const observedType = typeof observedSchema[key];
      let typeHistory: Set<string> = new Set();

      for (const record of this.history) {
        if (record.observedSchema && typeof record.observedSchema === 'object' && record.observedSchema !== null) {
          const historicalValue = record.observedSchema[key];
          if (historicalValue !== undefined) {
            typeHistory.add(typeof historicalValue);
          }
        }
      }

      if (typeHistory.size > 1) {
        historyDrifts.push({
          field: key,
          change: "TYPE_VARIATION",
          count: 1,
          observedTypes: Array.from(typeHistory),
        });
      }
    }

    return historyDrifts;
  }

  monitorSchema(observedSchema: any): {
    driftDetails: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[];
  } {
    const baselineDrifts = this.compareSchemas(observedSchema, this.baselineSchema);
    const historyDrifts = this.compareAgainstHistory(observedSchema);

    const combinedDrifts = [...baselineDrifts, ...historyDrifts];

    this.history.push({
      observedSchema,
      driftDetails: combinedDrifts,
    });

    return {
      driftDetails: combinedDrifts,
    };
  }

  generateReport(): SchemaDriftReport {
    const summary: Record<string, {
      description: string;
      count: number;
      examples: string[];
    }> = {};
    const allDrifts: {
      field: string;
      change: string;
      count: number;
      observedTypes: string[];
    }[] = [];

    for (const record of this.history) {
      allDrifts.push(...record.driftDetails);
    }

    const driftMap = new Map<string, {
      description: string;
      count: number;
      examples: string[];
    }>();

    for (const drift of allDrifts) {
      const key = `${drift.field}:${drift.change}`;
      if (!driftMap.has(key)) {
        driftMap.set(key, {
          description: `Field '${drift.field}' experienced '${drift.change}'`,
          count: 0,
          examples: [],
        });
      }
      const existing = driftMap.get(key)!;
      existing.count += drift.count;
      if (!existing.examples.includes(drift.change)) {
        existing.examples.push(drift.change);
      }
    }

    const finalSummary: Record<string, {
      description: string;
      count: number;
      examples: string[];
    }> = {};
    driftMap.forEach((value, key) => {
      finalSummary[key] = value;
    });

    return {
      baselineSchema: this.baselineSchema,
      history: this.history,
      summary: {
        totalDrifts: allDrifts.length,
        driftDetails: finalSummary,
      },
    };
  }
}