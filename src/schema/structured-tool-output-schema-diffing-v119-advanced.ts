import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContentBlock {
  type: "text" | "tool_use" | "thinking";
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

interface FieldSchema {
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  properties?: Record<string, FieldSchema>;
}

interface Schema {
  type: string;
  properties?: Record<string, FieldSchema>;
}

interface FieldStatistics {
  count: number;
  sum: number;
  mean: number;
  variance: number;
  cardinality: number;
}

export interface SemanticDiffReport {
  structuralDiff: {
    field: string;
    message: string;
    severity: "Warning" | "Error";
  }[];
  semanticDriftWarnings: {
    field: string;
    message: string;
    severity: "Warning";
  }[];
}

type SchemaDiffResult = {
  structural: {
    field: string;
    message: string;
    severity: "Warning" | "Error";
  }[];
  semantic: {
    field: string;
    message: string;
    severity: "Warning";
  }[];
};

const calculateStatistics = (data: unknown[]): FieldStatistics => {
  if (!data || data.length === 0) {
    return { count: 0, sum: 0, mean: 0, variance: 0, cardinality: 0 };
  }

  const count = data.length;
  let sum = 0;
  let sumOfSquares = 0;
  const uniqueValues = new Set<unknown>();

  if (typeof data[0] === 'number') {
    sum = data.reduce((acc, val) => acc + (val as number), 0);
    for (const val of data) {
      const diff = (val as number) - (sum / count);
      sumOfSquares += diff * diff;
    }
    const mean = sum / count;
    const variance = sumOfSquares / count;
    return { count, sum: mean, mean, variance: variance / count, cardinality: uniqueValues.size };
  } else {
    // Simplified for non-numeric types for this example
    return { count, sum: 0, mean: 0, variance: 0, cardinality: new Set(data).size };
  }
};

const getFieldValues = (data: Record<string, unknown>, fieldName: string): unknown[] => {
  if (!data[fieldName]) {
    return [];
  }
  const value = data[fieldName];
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'number') as unknown[];
  }
  if (typeof value === 'number') {
    return [value];
  }
  return [];
};

const compareStatistics = (
  oldStats: FieldStatistics,
  newStats: FieldStatistics,
  fieldName: string
): {
  message: string;
  severity: "Warning";
} => {
  const meanChange = Math.abs(oldStats.mean - newStats.mean) / Math.max(1e-6, Math.abs(oldStats.mean), Math.abs(newStats.mean));
  const varianceChange = Math.abs(oldStats.variance - newStats.variance) / Math.max(1e-6, Math.abs(oldStats.variance), Math.abs(newStats.variance));
  const cardinalityChange = Math.abs(oldStats.cardinality - newStats.cardinality) / Math.max(1, Math.abs(oldStats.cardinality), Math.abs(newStats.cardinality));

  if (meanChange > 0.5 || varianceChange > 0.5 || cardinalityChange > 0.5) {
    return {
      message: `Significant statistical drift detected: Mean change factor: ${meanChange.toFixed(2)}, Variance change factor: ${varianceChange.toFixed(2)}, Cardinality change factor: ${cardinalityChange.toFixed(2)}.`,
      severity: "Warning",
    };
  }
  return { message: "", severity: "Warning" };
};

const analyzeSchema = (
  schema: Schema,
  sampleData: Record<string, unknown>[]
): Record<string, { stats: FieldStatistics; schema: FieldSchema }> => {
  const fieldStats: Record<string, { stats: FieldStatistics; schema: FieldSchema }> = {};

  if (!schema.properties) return fieldStats;

  for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
    const sampleDataForField: unknown[][] = [];
    for (const data of sampleData) {
      const values = getFieldValues(data, fieldName);
      sampleDataForField.push(...values);
    }

    const stats = calculateStatistics(sampleDataForField);
    fieldStats[fieldName] = { stats, schema: fieldSchema };
  }
  return fieldStats;
};

export const diffSchemaAdvanced = (
  oldSchema: Schema,
  newSchema: Schema,
  sampleData: Record<string, unknown>[]
): SemanticDiffReport => {
  const oldFields = oldSchema.properties || {} as Record<string, FieldSchema>;
  const newFields = newSchema.properties || {} as Record<string, FieldSchema>;

  const oldAnalysis = analyzeSchema(oldSchema, sampleData);
  const newAnalysis = analyzeSchema(newSchema, sampleData);

  const structuralDiff: {
    field: string;
    message: string;
    severity: "Warning" | "Error";
  }[] = [];

  const semanticDriftWarnings: {
    field: string;
    message: string;
    severity: "Warning";
  }[] = [];

  const allFields = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);

  for (const field of allFields) {
    const oldField = oldFields[field];
    const newField = newFields[field];

    // 1. Structural Diffing
    if (!oldField && newField) {
      structuralDiff.push({
        field,
        message: `New field added: ${newField.description || 'No description'}`,
        severity: "Warning",
      });
    } else if (oldField && !newField) {
      structuralDiff.push({
        field,
        message: `Field removed: ${oldField.description || 'No description'}`,
        severity: "Error",
      });
    } else if (oldField && newField) {
      if (oldField.type !== newField.type) {
        structuralDiff.push({
          field,
          message: `Type mismatch: Changed from ${oldField.type} to ${newField.type}.`,
          severity: "Warning",
        });
      } else if (oldField.required !== newField.required) {
        structuralDiff.push({
          field,
          message: `Required status changed: ${oldField.required ? "Required" : "Optional"} -> ${newField.required ? "Required" : "Optional"}.`,
          severity: "Warning",
        });
      }
    }

    // 2. Semantic Drift Detection (Only if field exists in both)
    if (oldField && newField) {
      const oldStats = oldAnalysis[field]?.stats;
      const newStats = newAnalysis[field]?.stats;

      if (oldStats && newStats) {
        const drift = compareStatistics(oldStats, newStats, field);
        if (drift.message) {
          semanticDriftWarnings.push({
            field,
            message: `Semantic Drift Warning: ${drift.message}`,
            severity: "Warning",
          });
        }
      }
    }
  }

  return {
    structuralDiff,
    semanticDriftWarnings,
  };
};

export {
  diffSchemaAdvanced,
};