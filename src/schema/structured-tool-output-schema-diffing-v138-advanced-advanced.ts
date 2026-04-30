import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaDiffReport = {
  path: string;
  type: "MISSING" | "TYPE_MISMATCH" | "STRUCTURE_CHANGE" | "VALUE_CHANGE";
  message: string;
  suggested_remediation: string;
  old_value?: unknown;
  new_value?: unknown;
};

type ConflictResolutionStrategy = "prefer_new" | "prefer_old" | "merge_union";

export class SchemaDiffingEngine {
  private readonly strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = "prefer_new") {
    this.strategy = strategy;
  }

  private isObject(item: unknown): item is Record<string, unknown> {
    return typeof item === "object" && item !== null && !Array.isArray(item);
  }

  private isArray(item: unknown): item is unknown[] {
    return Array.isArray(item);
  }

  private compareSchemas(
    oldSchema: unknown,
    newSchema: unknown,
    path: string,
  ): SchemaDiffReport[] {
    const reports: SchemaDiffReport[] = [];

    if (typeof oldSchema !== typeof newSchema) {
      reports.push({
        path,
        type: "TYPE_MISMATCH",
        message: `Schema type mismatch at path '${path}'. Old type: ${typeof oldSchema}, New type: ${typeof newSchema}.`,
        suggested_remediation: `Review schema definition. Consider using a union type or explicit casting if types are expected to vary.`,
        old_value: oldSchema,
        new_value: newSchema,
      });
      return reports;
    }

    if (this.isObject(oldSchema) && this.isObject(newSchema)) {
      const oldKeys = Object.keys(oldSchema);
      const newKeys = Object.keys(newSchema);
      const allKeys = new Set([...oldKeys, ...newKeys]);

      for (const key of allKeys) {
        const newPath = `${path}.${key}`;
        const oldVal = oldSchema[key];
        const newVal = newSchema[key];

        if (oldVal === undefined && newVal === undefined) continue;

        if (oldVal === undefined) {
          reports.push({
            path: newPath,
            type: "MISSING",
            message: `Field '${key}' is new in the schema.`,
            suggested_remediation: "Accept the new field unless it introduces unexpected data.",
            new_value: newVal,
          });
        } else if (newVal === undefined) {
          reports.push({
            path: newPath,
            type: "MISSING",
            message: `Field '${key}' is missing in the new schema.`,
            suggested_remediation: "Determine if this field is deprecated or if its absence is intentional.",
            old_value: oldVal,
          });
        } else if (this.isObject(oldVal) && this.isObject(newVal)) {
          reports.push(...this.compareSchemas(oldVal, newVal, newPath));
        } else if (this.isArray(oldVal) && this.isArray(newVal)) {
          reports.push(...this.compareArraySchemas(oldVal, newVal, newPath));
        } else if (typeof oldVal !== "object" && typeof newVal !== "object") {
          if (oldVal !== newVal) {
            reports.push({
              path: newPath,
              type: "VALUE_CHANGE",
              message: `Primitive value change detected for field '${key}'.`,
              suggested_remediation: `Compare values: Old=${oldVal}, New=${newVal}.`,
              old_value: oldVal,
              new_value: newVal,
            });
          }
        }
      }
    } else if (this.isArray(oldSchema) && this.isArray(newSchema)) {
      // Array comparison is complex; for simplicity, we treat structure change detection here.
      reports.push({
        path,
        type: "STRUCTURE_CHANGE",
        message: "Array structure comparison is complex. Check element count or type consistency manually.",
        suggested_remediation: "If element count differs significantly, review array constraints.",
        old_value: oldSchema,
        new_value: newSchema,
      });
    }

    return reports;
  }

  private compareArraySchemas(
    oldArray: unknown[],
    newArray: unknown[],
    path: string,
  ): SchemaDiffReport[] {
    const reports: SchemaDiffReport[] = [];
    const minLength = Math.min(oldArray.length, newArray.length);

    // Check for length change
    if (oldArray.length !== newArray.length) {
      reports.push({
        path,
        type: "STRUCTURE_CHANGE",
        message: `Array length mismatch. Old length: ${oldArray.length}, New length: ${newArray.length}.`,
        suggested_remediation: "Adjust array size constraints or handle variable length gracefully.",
        old_value: oldArray,
        new_value: newArray,
      });
    }

    // Check element-wise changes up to the minimum length
    for (let i = 0; i < minLength; i++) {
      const itemPath = `${path}[${i}]`;
      const oldItem = oldArray[i];
      const newItem = newArray[i];

      if (this.isObject(oldItem) && this.isObject(newItem)) {
        reports.push(...this.compareSchemas(oldItem, newItem, itemPath));
      } else if (this.isObject(oldItem) && !this.isObject(newItem)) {
        reports.push({
          path: itemPath,
          type: "TYPE_MISMATCH",
          message: `Array element type mismatch at index ${i}. Old: Object, New: ${typeof newItem}.`,
          suggested_remediation: "Ensure array elements maintain consistent object structure.",
          old_value: oldItem,
          new_value: newItem,
        });
      }
    }

    return reports;
  }

  /**
   * Compares two structured tool output schemas (represented as JSON objects)
   * and generates a detailed report of all discrepancies.
   * @param oldSchema The schema from the previous version.
   * @param newSchema The schema from the current version.
   * @returns A detailed SchemaDiffReport object.
   */
  public diffstructuredtooloutputschema(
    oldSchema: unknown,
    newSchema: unknown,
  ): SchemaDiffReport[] {
    if (!this.isObject(oldSchema) || !this.isObject(newSchema)) {
      return [{
        path: "$root",
        type: "TYPE_MISMATCH",
        message: "Both schemas must be valid JSON objects for comparison.",
        suggested_remediation: "Ensure inputs are structured objects.",
        old_value: oldSchema,
        new_value: newSchema,
      }];
    }

    return this.compareSchemas(oldSchema, newSchema, "$root");
  }
}