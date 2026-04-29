import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Schema = Record<string, any>;

type ConflictResolutionStrategy = "latest_wins" | "most_specific" | "union_with_defaults";

export class StructuredToolOutputSchemaMerger {
  private readonly schemas: Schema[];
  private readonly strategy: ConflictResolutionStrategy;

  constructor(schemas: Schema[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema array cannot be empty.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveConflict(
    key: string,
    values: { schema: Schema; value: any }[]
  ): any {
    switch (this.strategy) {
      case "latest_wins":
        return values[values.length - 1].value;
      case "most_specific":
        return this.resolveMostSpecific(key, values);
      case "union_with_defaults":
        return this.resolveUnionWithDefaults(key, values);
    }
  }

  private resolveMostSpecific(
    key: string,
    values: { schema: Schema; value: any }[]
  ): any {
    const first = values[0].value;
    const last = values[values.length - 1].value;

    if (typeof first === 'object' && first !== null && typeof last === 'object' && last !== null) {
      // Simple heuristic: if both are objects, try to merge properties if they are simple types
      // For complex schemas, we just take the last one as a fallback, but this is a placeholder for deep logic.
      return last;
    }
    // In a real scenario, this would compare type definitions (e.g., 'string' vs 'number')
    // and pick the one that constrains the type the most.
    return last;
  }

  private resolveUnionWithDefaults(
    key: string,
    values: { schema: Schema; value: any }[]
  ): any {
    // This strategy aims to combine all possible types/constraints.
    // For simplicity here, we'll merge properties if they are objects, otherwise, we take the union of types.
    const mergedSchema: Record<string, any> = {};
    let hasDefault = false;
    let defaultValue: any = undefined;

    for (const { schema, value } of values) {
      if (typeof schema === 'object' && schema !== null) {
        Object.assign(mergedSchema, schema);
      }
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value !== null && !hasDefault) {
          defaultValue = value;
          hasDefault = true;
        }
      }
    }

    return {
      type: "object",
      properties: mergedSchema,
      default: defaultValue,
    };
  }

  public mergeSchemas(): Schema {
    const mergedSchema: Record<string, any> = {};

    for (const key of Object.keys(this.schemas[0] || {})) {
      const conflictValues: { schema: Schema; value: any }[] = [];

      for (let i = 0; i < this.schemas.length; i++) {
        const schema = this.schemas[i];
        const value = schema[key];
        if (value !== undefined) {
          conflictValues.push({ schema: schema, value: value });
        }
      }

      if (conflictValues.length > 0) {
        mergedSchema[key] = this.resolveConflict(key, conflictValues);
      }
    }

    return mergedSchema;
  }
}