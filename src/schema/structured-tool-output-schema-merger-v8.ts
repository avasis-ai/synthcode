import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type SchemaType = "string" | "number" | "boolean" | "array" | "object" | "any";

export enum SchemaMergeConflict {
  TypeConflict = "TypeConflict",
  FieldConflict = "FieldConflict",
  CardinalityConflict = "CardinalityConflict",
}

export interface MergeContext {
  sourceA: string;
  sourceB: string;
  path: string;
}

export interface SchemaField {
  type: SchemaType;
  description?: string;
  required?: boolean;
  properties?: Record<string, SchemaField>;
  items?: {
    type: SchemaType;
    description?: string;
  };
}

export class StructuredToolOutputSchemaMergerV8 {
  private readonly conflictResolutionStrategy: (
    conflict: SchemaMergeConflict,
    sourceA: SchemaField,
    sourceB: SchemaField,
    context: MergeContext
  ) => SchemaField;

  constructor(
    conflictResolutionStrategy: (
      conflict: SchemaMergeConflict,
      sourceA: SchemaField,
      sourceB: SchemaField,
      context: MergeContext
    ) => SchemaField
  ) {
    this.conflictResolutionStrategy = conflictResolutionStrategy;
  }

  public mergeSchemas(
    schemaA: SchemaField,
    schemaB: SchemaField,
    context: MergeContext
  ): SchemaField {
    if (schemaA.type !== schemaB.type) {
      return this.conflictResolutionStrategy(
        SchemaMergeConflict.TypeConflict,
        schemaA,
        schemaB,
        context
      );
    }

    if (schemaA.type === "object") {
      return this.mergeObjectSchemas(
        schemaA,
        schemaB,
        context
      );
    }

    if (schemaA.type === "array") {
      return this.mergeArraySchemas(
        schemaA,
        schemaB,
        context
      );
    }

    // For primitive types, if they are different, the conflict resolver handles it.
    // If they are the same, we prefer the more descriptive one or just keep one.
    return schemaA;
  }

  private mergeObjectSchemas(
    schemaA: SchemaField,
    schemaB: SchemaField,
    context: MergeContext
  ): SchemaField {
    const mergedProperties: Record<string, SchemaField> = { ...schemaA.properties };
    const allKeys = new Set([
      ...(schemaA.properties ? Object.keys(schemaA.properties) : []),
      ...(schemaB.properties ? Object.keys(schemaB.properties) : []),
    ]);

    for (const key of allKeys) {
      const propA = schemaA.properties?.[key];
      const propB = schemaB.properties?.[key];
      const newPath = `${context.path}.${key}`;

      if (propA && propB) {
        const mergedField = this.mergeSchemas(
          propA,
          propB,
          {
            sourceA: context.sourceA,
            sourceB: context.sourceB,
            path: newPath,
          }
        );
        mergedProperties[key] = mergedField;
      } else if (propA) {
        mergedProperties[key] = propA;
      } else if (propB) {
        mergedProperties[key] = propB;
      }
    }

    const mergedSchema: SchemaField = {
      type: "object",
      properties: mergedProperties,
      description: `Merged object from ${context.sourceA} and ${context.sourceB}.`,
    };

    // Simple required logic merge (if either requires it, it requires it)
    mergedSchema.required = (schemaA.required || schemaB.required) && (
      schemaA.required || schemaB.required
    );

    return mergedSchema;
  }

  private mergeArraySchemas(
    schemaA: SchemaField,
    schemaB: SchemaField,
    context: MergeContext
  ): SchemaField {
    if (!schemaA.items || !schemaB.items) {
      return { type: "array", description: "One or both sources lacked item definitions." };
    }

    const mergedItems = this.mergeSchemas(
      { type: schemaA.items.type, properties: {} } as SchemaField,
      { type: schemaB.items.type, properties: {} } as SchemaField,
      {
        sourceA: context.sourceA,
        sourceB: context.sourceB,
        path: `${context.path}.items`,
      }
    );

    return {
      type: "array",
      items: {
        type: mergedItems.type,
        description: `Merged array items from ${context.sourceA} and ${context.sourceB}.`,
      },
    };
  }
}

export const defaultConflictResolver = (
  conflict: SchemaMergeConflict,
  sourceA: SchemaField,
  sourceB: SchemaField,
  context: MergeContext
): SchemaField => {
  switch (conflict) {
    case SchemaMergeConflict.TypeConflict:
      if (sourceA.type === "string" && sourceB.type === "string") {
        return { type: "string" };
      }
      if (sourceA.type === "number" && sourceB.type === "number") {
        return { type: "number" };
      }
      // Example: If one is object and the other is string, prefer object if it has structure
      if (sourceA.type === "object" || sourceB.type === "object") {
        return { type: "object" };
      }
      // Fallback: Union types (simplified to 'any' or string/object)
      return { type: "any", description: `Conflict between ${sourceA.type} and ${sourceB.type}. Merged to 'any'.` };

    case SchemaMergeConflict.FieldConflict:
      // This case is handled within mergeObjectSchemas, but for completeness:
      return { type: "any", description: "Field conflict detected, manual resolution required." };

    case SchemaMergeConflict.CardinalityConflict:
      return { type: "any", description: "Cardinality conflict detected, using union of possibilities." };
  }
};

export const createSchemaMerger = (
  sourceA: SchemaField,
  sourceB: SchemaField,
): StructuredToolOutputSchemaMergerV8 => {
  return new StructuredToolOutputSchemaMergerV8(defaultConflictResolver);
};