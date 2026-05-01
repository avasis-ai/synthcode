import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Schema = Record<string, any>;

interface MergeOptions {
  /**
   * Strategy for resolving conflicts when merging properties.
   * 'prefer_left': Use the schema from the left input.
   * 'prefer_right': Use the schema from the right input.
   * 'merge_deep': Attempt to recursively merge the properties.
   */
  conflictStrategy?: "prefer_left" | "prefer_right" | "merge_deep";
}

export class StructuredToolOutputSchemaMerger {
  private readonly options: MergeOptions;

  constructor(options: MergeOptions = {}) {
    this.options = {
      conflictStrategy: options.conflictStrategy || "merge_deep",
    };
  }

  /**
   * Recursively merges two schemas based on the configured conflict strategy.
   * @param leftSchema The base schema.
   * @param rightSchema The schema to merge into the base.
   * @returns The merged schema.
   */
  private mergeSchemasRecursive(
    leftSchema: Schema,
    rightSchema: Schema,
  ): Schema {
    const merged: Schema = { ...leftSchema };

    for (const key in rightSchema) {
      if (!Object.prototype.hasOwnProperty.call(rightSchema, key)) continue;

      const rightValue = rightSchema[key];
      const leftValue = leftSchema[key];

      if (Object.prototype.hasOwnProperty.call(leftSchema, key)) {
        if (typeof leftValue === 'object' && leftValue !== null && typeof rightValue === 'object' && rightValue !== null) {
          if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
            // Simple array merging: prefer right if types differ, otherwise merge elements if possible
            merged[key] = [...leftValue, ...rightValue];
          } else if (typeof leftValue === 'object' && typeof rightValue === 'object') {
            // Deep merge for objects
            merged[key] = this.mergeSchemasRecursive(
              (leftValue as Schema),
              (rightValue as Schema),
            );
          } else {
            // Type conflict or simple value overwrite
            this.resolveConflict(key, leftValue, rightValue, merged);
          }
        } else {
          // Key exists but types are different (e.g., object vs primitive)
          this.resolveConflict(key, leftValue, rightValue, merged);
        }
      } else {
        // Key only exists in rightSchema, simply add it
        merged[key] = rightValue;
      }
    }
    return merged;
  }

  /**
   * Handles conflict resolution for a specific key based on the configured strategy.
   * @param key The key causing the conflict.
   * @param leftValue The value from the left schema.
   * @param rightValue The value from the right schema.
   * @param target The schema object being built.
   */
  private resolveConflict(
    key: string,
    leftValue: any,
    rightValue: any,
    target: Schema,
  ): void {
    switch (this.options.conflictStrategy) {
      case "prefer_left":
        target[key] = leftValue;
        break;
      case "prefer_right":
        target[key] = rightValue;
        break;
      case "merge_deep":
        // For primitives, prefer right if it's more specific or if left is null/undefined
        if (typeof leftValue === 'object' && leftValue !== null && typeof rightValue === 'object' && rightValue !== null) {
          // This case should ideally be handled by the main recursive merge, but as a fallback:
          target[key] = this.mergeSchemasRecursive(leftValue as Schema, rightValue as Schema);
        } else if (leftValue === undefined || leftValue === null) {
          target[key] = rightValue;
        } else if (rightValue === undefined || rightValue === null) {
          target[key] = leftValue;
        } else {
          // Primitive conflict: Prefer the type that seems more robust (heuristic)
          // For simplicity here, we'll prefer the right value unless it's clearly worse.
          target[key] = rightValue;
        }
        break;
    }
  }

  /**
   * Merges multiple structured tool output schemas into a single, advanced schema.
   *
   * @param schemas An array of input schemas to merge.
   * @returns The final, merged schema object.
   * @throws Error if merging fails due to structural invariants violation (placeholder).
   */
  public merge(schemas: Schema[]): Schema {
    if (!schemas || schemas.length === 0) {
      return {} as Schema;
    }

    let currentSchema: Schema = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      currentSchema = this.mergeSchemasRecursive(currentSchema, nextSchema);
    }

    // Advanced validation check placeholder: Ensure structural invariants are maintained
    this.validateInvariants(currentSchema);

    return currentSchema;
  }

  /**
   * Placeholder for advanced structural invariant validation.
   * In a real implementation, this would check for things like:
   * 1. Circular references.
   * 2. Consistency of required fields across all merged paths.
   * 3. Compatibility with known structural patterns (e.g., if 'id' is present, it must be a string).
   * @param schema The schema to validate.
   */
  private validateInvariants(schema: Schema): void {
    // Example invariant check: Ensure no top-level key is named 'role' if it's not expected.
    if (Object.prototype.hasOwnProperty.call(schema, "role") && typeof schema.role !== 'string') {
      // throw new Error("Invariant Violation: Top-level 'role' field must be a string.");
    }
    // In a production system, this would contain complex recursive validation logic.
  }
}