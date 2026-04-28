import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  type: "string" | "number" | "boolean" | "object" | "array" | "enum";
  description?: string;
  required?: boolean;
  properties?: Record<string, SchemaField>;
  items?: {
    type: "string" | "number" | "boolean" | "object" | "array";
    properties?: Record<string, SchemaField>;
  };
  enum_values?: string[];
}

export interface StructuredSchema {
  type: "object";
  properties: Record<string, SchemaField>;
  required?: string[];
}

export enum SchemaMergeConflict {
  TYPE_MISMATCH = "TYPE_MISMATCH",
  REQUIRED_FIELD_CONFLICT = "REQUIRED_FIELD_CONFLICT",
  ENUM_CONFLICT = "ENUM_CONFLICT",
  UNKNOWN_CONFLICT = "UNKNOWN_CONFLICT",
}

export type ConflictResolutionStrategy = (
  conflict: SchemaMergeConflict,
  fieldPath: string,
  schemaA: SchemaField,
  schemaB: SchemaField
) => {
  resolved: SchemaField;
  conflictOccurred: boolean;
};

export class StructuredToolOutputSchemaMerger {
  private readonly resolver: ConflictResolutionStrategy;

  constructor(resolver: ConflictResolutionStrategy) {
    this.resolver = resolver;
  }

  public merge(schemaA: StructuredSchema, schemaB: StructuredSchema): {
    mergedSchema: StructuredSchema;
    conflicts: Record<string, SchemaMergeConflict[]>;
  } {
    const mergedProperties: Record<string, SchemaField> = {};
    const conflicts: Record<string, SchemaMergeConflict[]> = {};

    const allKeys = new Set<string>([
      ...Object.keys(schemaA.properties),
      ...Object.keys(schemaB.properties),
    ]);

    for (const key of allKeys) {
      const fieldA = schemaA.properties[key];
      const fieldB = schemaB.properties[key];

      if (!fieldA && !fieldB) continue;

      let resolvedField: SchemaField;
      let conflict: SchemaMergeConflict | null = null;

      if (!fieldA) {
        resolvedField = fieldB;
      } else if (!fieldB) {
        resolvedField = fieldA;
      } else {
        const conflictResult = this.resolver(
          SchemaMergeConflict.UNKNOWN_CONFLICT,
          key,
          fieldA,
          fieldB
        );
        resolvedField = conflictResult.resolved;
        if (conflictResult.conflictOccurred) {
          if (!conflicts[key]) {
            conflicts[key] = [];
          }
          conflicts[key].push(SchemaMergeConflict.UNKNOWN_CONFLICT);
        }
      }

      mergedProperties[key] = resolvedField;
    }

    const mergedSchema: StructuredSchema = {
      type: "object",
      properties: mergedProperties,
      required: [...(schemaA.required || []), ...(schemaB.required || [])] as string[],
    };

    return {
      mergedSchema,
      conflicts,
    };
  }

  public validate(schema: StructuredSchema, strategy: ConflictResolutionStrategy): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (!schema.properties) {
      errors.push("Schema must contain properties.");
      return { isValid: false, errors };
    }

    for (const key in schema.properties) {
      const field = schema.properties[key];
      if (!field) continue;

      // Basic type validation placeholder
      if (field.type === "object") {
        if (!field.properties) {
          errors.push(`Property ${key} (object) must define properties.`);
        }
      }
    }

    // In a real implementation, this would recursively validate structure against the strategy's rules.
    return { isValid: errors.length === 0, errors };
  }
}

export const createDefaultResolver: ConflictResolutionStrategy = (
  conflict: SchemaMergeConflict,
  fieldPath: string,
  schemaA: SchemaField,
  schemaB: SchemaField
): {
  resolved: SchemaField;
  conflictOccurred: boolean;
} => {
  let resolved: SchemaField;
  let conflictOccurred = false;

  if (conflict === SchemaMergeConflict.TYPE_MISMATCH) {
    if (schemaA.type !== schemaB.type) {
      conflictOccurred = true;
      resolved = { type: "object", properties: {}, required: [] }; // Default to object on mismatch
    } else {
      resolved = { type: schemaA.type, properties: {}, required: [] };
    }
  } else if (conflict === SchemaMergeConflict.REQUIRED_FIELD_CONFLICT) {
    // Logic to handle required field conflict (e.g., if one says required and other doesn't)
    conflictOccurred = true;
    resolved = { type: "object", properties: {}, required: [] };
  } else if (conflict === SchemaMergeConflict.ENUM_CONFLICT) {
    // Logic to handle enum conflict (e.g., union of values or fail)
    conflictOccurred = true;
    resolved = { type: "object", properties: {}, required: [] };
  } else {
    // Default merge: Prefer A if it's more detailed, otherwise use B
    resolved = { type: "object", properties: { ...schemaA.properties, ...schemaB.properties }, required: [...(schemaA.required || []), ...(schemaB.required || [])] };
  }

  return { resolved, conflictOccurred };
};