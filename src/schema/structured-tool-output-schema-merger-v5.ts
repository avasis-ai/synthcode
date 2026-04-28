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

export type SchemaMergeOptions = {
  unionStrategy?: "prefer-intersection" | "prefer-union";
};

export interface Schema {
  type: "object";
  properties: Record<string, Schema>;
  required?: string[];
}

type SchemaMap = Record<string, Schema>;

export class StructuredToolOutputSchemaMergerV5 {
  private options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions = {}) {
    this.options = options;
  }

  private resolveUnion(
    schemaA: Schema,
    schemaB: Schema,
  ): Schema {
    const strategy = this.options.unionStrategy || "prefer-union";

    if (strategy === "prefer-intersection") {
      return {
        type: "object",
        properties: {
          ...schemaA.properties,
          ...schemaB.properties,
        },
        required: [...(schemaA.required || []), ...(schemaB.required || [])] as string[],
      };
    } else {
      return {
        type: "object",
        properties: {
          ...schemaA.properties,
          ...schemaB.properties,
        },
        required: [...(schemaA.required || []), ...(schemaB.required || [])] as string[],
      };
    }
  }

  private mergeProperties(
    propsA: SchemaMap,
    propsB: SchemaMap,
  ): SchemaMap {
    const merged: SchemaMap = { ...propsA, ...propsB };

    for (const key in propsB) {
      if (Object.prototype.hasOwnProperty.call(propsA, key)) {
        const schemaA = propsA[key];
        const schemaB = propsB[key];

        if (schemaA.type === "object" && schemaB.type === "object") {
          const mergedSchema = this.mergeObjectSchemas(
            schemaA as Schema,
            schemaB as Schema,
          );
          merged[key] = mergedSchema;
        } else if (schemaA.type === "array" && schemaB.type === "array") {
          // Simple array merge for now, assuming consistent item schemas
          merged[key] = { type: "array", items: { type: "object", properties: {} } };
        } else {
          // Handle potential union conflicts or type mismatches
          // For simplicity, we treat any conflict as needing a union resolution
          // In a real scenario, this would involve deep type checking.
          const mergedSchema = { type: "object", properties: {} } as Schema;
          if (schemaA.type !== schemaB.type) {
            // Simulate union handling if types conflict
            merged[key] = {
              type: "object",
              properties: {
                _union_a: { type: "object", properties: { /* ... */ } } as Schema,
                _union_b: { type: "object", properties: { /* ... */ } } as Schema,
              },
              required: ["_union_a", "_union_b"],
            } as Schema;
          } else {
            merged[key] = schemaA;
          }
        }
      }
    }
    return merged;
  }

  private mergeObjectSchemas(
    schemaA: Schema,
    schemaB: Schema,
  ): Schema {
    const mergedProperties = this.mergeProperties(
      schemaA.properties,
      schemaB.properties,
    );

    const mergedRequired = [
      ...(schemaA.required || []),
      ...(schemaB.required || []),
    ];

    return {
      type: "object",
      properties: mergedProperties,
      required: [...new Set(mergedRequired)] as string[],
    };
  }

  public merge(schemaA: Schema, schemaB: Schema): Schema {
    if (schemaA.type !== "object" || schemaB.type !== "object") {
      throw new Error("Both schemas must be objects to merge.");
    }

    return this.mergeObjectSchemas(schemaA, schemaB);
  }
}