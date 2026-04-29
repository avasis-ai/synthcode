import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Schema = Record<string, any>;

type ConflictResolver = "prefer-latest" | "prefer-earliest" | "union-all";

interface MergeOptions {
  resolver?: ConflictResolver;
  /**
   * Custom function to resolve conflicts for a specific field.
   * Receives: (fieldName: string, conflictingValues: unknown[], schemas: Schema[]): unknown
   */
  customConflictResolver?: (
    fieldName: string,
    conflictingValues: unknown[],
    schemas: Schema[]
  ) => unknown;
}

export class StructuredToolOutputSchemaMerger {
  private options: MergeOptions;

  constructor(options: MergeOptions = {}) {
    this.options = {
      resolver: "prefer-latest",
      customConflictResolver: undefined,
      ...options,
    };
  }

  private resolveConflict(
    fieldName: string,
    conflictingValues: unknown[],
    schemas: Schema[]
  ): unknown {
    if (this.options.customConflictResolver) {
      return this.options.customConflictResolver(
        fieldName,
        conflictingValues,
        schemas
      );
    }

    const resolver = this.options.resolver || "prefer-latest";

    switch (resolver) {
      case "prefer-latest":
        return conflictingValues[conflictingValues.length - 1];
      case "prefer-earliest":
        return conflictingValues[0];
      case "union-all":
        return this.unionAll(conflictingValues);
    }
  }

  private unionAll(values: unknown[]): unknown {
    if (values.length === 0) {
      return undefined;
    }
    const combined: Record<string, unknown> = {};
    for (const value of values) {
      if (typeof value === "object" && value !== null) {
        Object.assign(combined, value);
      } else {
        // Simple union for primitives, taking the last one seen
        combined["_union_fallback"] = value;
      }
    }
    return combined;
  }

  public mergeSchemas(schemas: Schema[]): { mergedSchema: Schema; conflicts: Record<string, string[]> } {
    if (!schemas || schemas.length === 0) {
      return { mergedSchema: {} as Schema, conflicts: {} };
    }

    const mergedSchema: Schema = {};
    const conflicts: Record<string, string[]> = {};

    for (const schema of schemas) {
      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          const value = schema[key];
          const existingValues = this.getExistingValues(key, schemas);

          if (existingValues.length === 0) {
            mergedSchema[key] = value;
          } else {
            const resolvedValue = this.resolveConflict(
              key,
              [...existingValues, value],
              schemas
            );
            mergedSchema[key] = resolvedValue;

            if (existingValues.length > 0) {
              if (!conflicts[key]) {
                conflicts[key] = [];
              }
              conflicts[key].push(`Conflict detected for field '${key}' resolved by ${this.options.resolver || 'default'}`);
            }
          }
        }
      }
    }

    return { mergedSchema, conflicts };
  }

  private getExistingValues(key: string, schemas: Schema[]): unknown[] {
    const values: unknown[] = [];
    for (const schema of schemas) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        values.push(schema[key]);
      }
    }
    return values;
  }
}