import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ConflictResolutionStrategy = "prefer_latest" | "union_all" | "custom_resolver";

interface SchemaMergeOptions {
  strategy: ConflictResolutionStrategy;
  customResolver?: (key: string, existingValue: unknown, newValue: unknown): unknown;
}

interface StructuredSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

interface SchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  example?: unknown;
  items?: {
    type: "string" | "number" | "boolean";
  };
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export class StructuredToolOutputSchemaMerger {
  private options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions) {
    this.options = options;
  }

  private resolveConflict(
    key: string,
    existingValue: unknown,
    newValue: unknown
  ): unknown {
    switch (this.options.strategy) {
      case "prefer_latest":
        return newValue;
      case "union_all":
        if (typeof existingValue === "object" && existingValue !== null && typeof newValue === "object" && newValue !== null) {
          return { ...existingValue, ...newValue } as unknown;
        }
        return newValue;
      case "custom_resolver":
        if (this.options.customResolver) {
          return this.options.customResolver(key, existingValue, newValue);
        }
        return newValue; // Fallback
    }
  }

  private mergeProperties(
    existingProps: Record<string, SchemaProperty>,
    newProps: Record<string, SchemaProperty>
  ): Record<string, SchemaProperty> {
    const merged: Record<string, SchemaProperty> = { ...existingProps };

    for (const key in newProps) {
      const newProp = newProps[key];
      if (Object.prototype.hasOwnProperty.call(merged, key)) {
        const existingProp = merged[key];
        const resolvedValue = this.resolveConflict(key, existingProp, newProp);
        merged[key] = resolvedValue as SchemaProperty;
      } else {
        merged[key] = newProp;
      }
    }
    return merged;
  }

  public mergeSchemas(schemas: StructuredSchema[]): StructuredSchema {
    if (!schemas || schemas.length === 0) {
      throw new Error("Input schema array cannot be empty.");
    }

    let mergedSchema: StructuredSchema = {
      type: "object",
      properties: {} as Record<string, SchemaProperty>,
    };

    for (const schema of schemas) {
      if (schema.type !== "object" || !schema.properties) {
        throw new Error("All input schemas must be of type 'object' with 'properties'.");
      }

      const currentProperties = mergedSchema.properties;
      const newProperties = schema.properties;

      const mergedProperties = this.mergeProperties(
        currentProperties,
        newProperties
      );

      mergedSchema.properties = mergedProperties;
    }

    return mergedSchema;
  }
}