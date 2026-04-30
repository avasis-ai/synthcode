import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Schema = Record<string, SchemaField>;

export interface SchemaField {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  properties?: Schema;
  items?: SchemaField;
}

export type ConflictResolutionStrategy = "precedence" | "union" | "strict";

export interface MergerOptions {
  precedence?: "latest" | "earliest";
  conflictStrategy?: ConflictResolutionStrategy;
}

export interface MergeReport {
  mergedSchema: Schema;
  warnings: string[];
  conflictsResolved: Record<string, { field: string; resolution: string }>;
}

export class SchemaMerger {
  private sourceSchemas: Schema[];
  private options: MergerOptions;

  constructor(sourceSchemas: Schema[], options: MergerOptions = {}) {
    this.sourceSchemas = sourceSchemas;
    this.options = {
      precedence: "latest",
      conflictStrategy: "precedence",
      ...options,
    };
  }

  private resolveConflict(
    key: string,
    field1: SchemaField,
    field2: SchemaField,
    index: number
  ): { mergedField: SchemaField; warning: string | null } {
    const { conflictStrategy } = this.options;
    let mergedField: SchemaField;
    let warning: string | null = null;

    if (field1.type !== field2.type) {
      if (conflictStrategy === "strict") {
        warning = `Type conflict detected for field '${key}': ${field1.type} vs ${field2.type}. Merging failed.`;
        return { mergedField: field1, warning };
      }
      if (conflictStrategy === "union") {
        warning = `Type conflict detected for field '${key}': ${field1.type} vs ${field2.type}. Using union type (conceptual).`;
        // In a real system, this would involve creating a union type representation.
        // For simplicity, we'll prioritize the first one and warn.
        mergedField = { ...field1, type: "any" } as SchemaField;
        return { mergedField, warning };
      }
      // Default to precedence (using the later one if precedence is 'latest')
      mergedField = field2;
      warning = `Type conflict detected for field '${key}': ${field1.type} vs ${field2.type}. Using ${this.options.precedence} strategy.`;
      return { mergedField, warning };
    }

    // Types match, check for structural conflicts (e.g., properties)
    if (field1.type === "object" && field2.type === "object") {
      const mergedProperties = this.mergeObjectProperties(key, field1.properties!, field2.properties!, index);
      mergedField = { ...field1, properties: mergedProperties } as SchemaField;
      return { mergedField, warning: null };
    }

    // Simple type merge (e.g., description merge)
    if (field1.description && field2.description) {
      warning = `Description merged for field '${key}'.`;
    }
    mergedField = {
      ...field1,
      description: field2.description || field1.description,
      required: field1.required === true || field2.required === true,
    } as SchemaField;

    return { mergedField, warning };
  }

  private mergeObjectProperties(
    parentKey: string,
    props1: Record<string, SchemaField>,
    props2: Record<string, SchemaField>,
    index: number
  ): Record<string, SchemaField> {
    const mergedProps: Record<string, SchemaField> = { ...props1 };
    const allKeys = new Set([...Object.keys(props1), ...Object.keys(props2)]);

    for (const key of allKeys) {
      const field1 = props1[key];
      const field2 = props2[key];

      if (!field1) {
        mergedProps[key] = field2;
        continue;
      }
      if (!field2) {
        continue;
      }

      const { mergedField, warning } = this.resolveConflict(key, field1, field2, index);
      mergedProps[key] = mergedField;
      // In a real implementation, we would collect these warnings.
    }
    return mergedProps;
  }

  public merge(): { report: MergeReport; unifiedSchema: Schema } {
    let unifiedSchema: Schema = {};
    const warnings: string[] = [];
    const conflictsResolved: Record<string, { field: string; resolution: string }> = {};

    if (this.sourceSchemas.length === 0) {
      return { report: { mergedSchema: {} as Schema, warnings: [], conflictsResolved: {} }, unifiedSchema: {} };
    }

    // Start with the first schema as the base
    let currentSchema: Schema = { ...this.sourceSchemas[0] };

    for (let i = 1; i < this.sourceSchemas.length; i++) {
      const nextSchema = this.sourceSchemas[i];
      const tempSchema: Schema = { ...currentSchema };

      for (const key of Object.keys(nextSchema)) {
        const nextField = nextSchema[key];
        const currentField = currentSchema[key];

        if (!currentField) {
          // New field found
          tempSchema[key] = nextField;
          continue;
        }

        // Field exists in both, resolve conflict
        const { mergedField, warning } = this.resolveConflict(
          key,
          currentField,
          nextField,
          i
        );
        tempSchema[key] = mergedField;

        if (warning) {
          warnings.push(warning);
          conflictsResolved[key] = { field: key, resolution: warning };
        }
      }
      currentSchema = tempSchema;
    }

    const report: MergeReport = {
      mergedSchema: currentSchema,
      warnings: warnings,
      conflictsResolved: conflictsResolved,
    };

    return { report, unifiedSchema: currentSchema };
  }
}