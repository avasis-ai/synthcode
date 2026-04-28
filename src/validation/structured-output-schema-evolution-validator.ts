import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description?: string;
}

export interface StructuredSchema {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
}

export interface SchemaHistory {
  schema: StructuredSchema;
  results: Record<string, unknown>[];
}

export class StructuredOutputSchemaEvolutionValidator {
  private history: SchemaHistory[] = [];
  private readonly driftThreshold: number;

  constructor(driftThreshold: number = 0.1) {
    this.driftThreshold = driftThreshold;
  }

  public recordSchema(schema: StructuredSchema, results: Record<string, unknown>[]): void {
    this.history.push({ schema, results });
  }

  private calculateFieldPresenceDrift(
    currentSchema: StructuredSchema,
    history: SchemaHistory[]
  ): number {
    if (history.length === 0) return 0;

    const currentFields = Object.keys(currentSchema.properties);
    let totalDeviation = 0;
    let comparisonCount = 0;

    for (const field of currentFields) {
      const currentField = currentSchema.properties[field];
      let presentInHistory = 0;
      let totalHistory = history.length;

      for (const record of history.results) {
        if (Object.prototype.hasOwnProperty.call(record, field)) {
          presentInHistory++;
        }
      }

      const presenceRatio = presentInHistory / totalHistory;
      // Deviation from perfect presence (1.0) or perfect absence (0.0)
      // We measure how far the observed presence deviates from the expected presence (1.0 if required, 0.0 otherwise)
      const expectedPresence = currentField.required ? 1.0 : 0.0;
      totalDeviation += Math.abs(presenceRatio - expectedPresence);
      comparisonCount++;
    }

    return totalDeviation / comparisonCount;
  }

  private calculateTypeVarianceDrift(
    currentSchema: StructuredSchema,
    history: SchemaHistory[]
  ): number {
    if (history.length === 0) return 0;

    let totalVariance = 0;
    let comparisonCount = 0;

    for (const field of Object.keys(currentSchema.properties)) {
      const currentField = currentSchema.properties[field];
      let typeCounts: Record<string, number> = {};
      let totalObservations = 0;

      for (const record of history.results) {
        if (Object.prototype.hasOwnProperty.call(record, field)) {
          const value = record[field];
          const actualType = typeof value;
          typeCounts[actualType] = (typeCounts[actualType] || 0) + 1;
          totalObservations++;
        }
      }

      if (totalObservations === 0) continue;

      // Simple variance check: If the current schema expects one type, but history shows many types, it's a drift.
      // We check if the observed types significantly deviate from the expected type.
      const expectedType = currentField.type;
      let observedTypeDeviation = 0;

      if (typeCounts[expectedType] < totalObservations * (1.0 - this.driftThreshold)) {
        // If the expected type is not dominant, count it as deviation
        observedTypeDeviation = 1.0;
      }

      totalVariance += observedTypeDeviation;
      comparisonCount++;
    }

    return totalVariance / comparisonCount;
  }

  public validate(currentSchema: StructuredSchema, currentResults: Record<string, unknown>[]): { isValid: boolean; message: string } {
    if (this.history.length === 0) {
      return { isValid: true, message: "No history available for comparison." };
    }

    const lastHistory = this.history[this.history.length - 1];

    // 1. Check for Schema Drift against History
    const presenceDrift = this.calculateFieldPresenceDrift(currentSchema, this.history);
    const typeVarianceDrift = this.calculateTypeVarianceDrift(currentSchema, this.history);

    const maxDrift = Math.max(presenceDrift, typeVarianceDrift);

    if (maxDrift > this.driftThreshold) {
      return {
        isValid: false,
        message: `Schema drift detected. Max drift (${maxDrift.toFixed(2)}) exceeds threshold (${this.driftThreshold}). Check field presence or type variance.`
      };
    }

    // 2. Check for immediate structural validity against the *new* schema
    // (This is a simplified check, assuming the input structure matches the current schema definition)
    const requiredFieldsMissing = currentSchema.required.filter(field => !Object.prototype.hasOwnProperty.call(currentResults, field));
    if (requiredFieldsMissing.length > 0) {
      return {
        isValid: false,
        message: `Validation failed: Missing required fields in current output: ${requiredFieldsMissing.join(', ')}`
      };
    }

    // If all checks pass, update history and return success
    this.recordSchema(currentSchema, currentResults);
    return { isValid: true, message: "Schema evolution validated successfully." };
  }
}