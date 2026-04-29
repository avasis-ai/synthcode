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

export interface SchemaField {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: Record<string, string>;
  default?: any;
  properties?: Record<string, SchemaField>;
}

export interface SchemaDiff {
  added: { field: SchemaField; reason: string }[];
  removed: { field: SchemaField; reason: string }[];
  modified: { field: SchemaField; changes: { key: string; old: any; new: any }[] }[];
  unchanged: { field: SchemaField }[];
}

export type Schema = Record<string, SchemaField>;

export interface SchemaDiffingService {
  compareSchemas(schemaA: Schema, schemaB: Schema): SchemaDiff;
}

export class StructuredToolOutputSchemaDiffingV121 implements SchemaDiffingService {
  compareSchemas(schemaA: Schema, schemaB: Schema): SchemaDiff {
    const diff: SchemaDiff = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    };

    const allKeys = new Set<string>([
      ...Object.keys(schemaA),
      ...Object.keys(schemaB),
    ]);

    for (const key of allKeys) {
      const fieldA = schemaA[key];
      const fieldB = schemaB[key];

      if (!fieldA && fieldB) {
        diff.added.push({ field: fieldB, reason: "Field present in Schema B but not in Schema A." });
      } else if (fieldA && !fieldB) {
        diff.removed.push({ field: fieldA, reason: "Field present in Schema A but not in Schema B." });
      } else if (fieldA && fieldB) {
        const fieldDiff = this.compareFields(fieldA, fieldB, key);
        if (fieldDiff.changes.length > 0 || fieldDiff.isModified || fieldDiff.isAdded || fieldDiff.isRemoved) {
          if (fieldDiff.isRemoved) {
            diff.removed.push({ field: fieldA, reason: `Field type or constraints changed significantly.` });
          } else if (fieldDiff.isAdded) {
            diff.added.push({ field: fieldB, reason: `Field added or significantly changed.` });
          } else if (fieldDiff.isModified) {
            diff.modified.push({ field: fieldB, changes: fieldDiff.changes });
          } else {
            diff.unchanged.push({ field: fieldB });
          }
        } else {
          diff.unchanged.push({ field: fieldB });
        }
      }
    }

    return diff;
  }

  private compareFields(
    fieldA: SchemaField,
    fieldB: SchemaField,
    key: string
  ): {
    changes: { key: string; old: any; new: any }[];
    isModified: boolean;
    isAdded: boolean;
    isRemoved: boolean;
  } {
    const changes: { key: string; old: any; new: any }[] = [];
    let isModified = false;
    let isAdded = false;
    let isRemoved = false;

    // 1. Compare basic properties
    if (fieldA.type !== fieldB.type) {
      changes.push({ key: "type", old: fieldA.type, new: fieldB.type });
      isModified = true;
    }
    if (fieldA.required !== fieldB.required) {
      changes.push({ key: "required", old: fieldA.required, new: fieldB.required });
      isModified = true;
    }
    if (fieldA.description !== fieldB.description) {
      changes.push({ key: "description", old: fieldA.description, new: fieldB.description });
      isModified = true;
    }
    if (fieldA.default !== fieldB.default) {
      changes.push({ key: "default", old: fieldA.default, new: fieldB.default });
      isModified = true;
    }

    // 2. Compare complex types (nested objects)
    if (fieldA.properties && fieldB.properties) {
      const nestedDiff = this.compareSchemas(fieldA.properties, fieldB.properties);
      if (nestedDiff.added.length > 0 || nestedDiff.removed.length > 0 || nestedDiff.modified.length > 0) {
        changes.push({ key: "properties", old: fieldA.properties, new: fieldB.properties });
        isModified = true;
      }
    }

    // 3. Determine overall status
    if (changes.length > 0) {
      isModified = true;
    }

    // Simple heuristic: If properties changed, or basic types changed, it's modified.
    // If we reached here and properties were compared, we treat it as modified if changes exist.
    if (isModified) {
      return { changes, isModified: true, isAdded: false, isRemoved: false };
    }

    // If types are identical and no properties were compared (i.e., primitives), it's unchanged.
    return { changes, isModified: false, isAdded: false, isRemoved: false };
  }
}