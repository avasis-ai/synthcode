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

export type SchemaDiffType =
  | "TypeMismatch"
  | "RequiredStatusChange"
  | "FieldAdded"
  | "FieldRemoved"
  | "NestedStructureChange";

export interface SchemaDiffDetail {
  path: string;
  diffType: SchemaDiffType;
  oldValue: unknown;
  newValue: unknown;
}

export interface DiffReport {
  diffs: SchemaDiffDetail[];
}

interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "object";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
}

export class StructuredToolOutputSchemaDiffer {
  private diffs: SchemaDiffDetail[] = [];

  public diffSchemas(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition
  ): DiffReport {
    this.diffs = [];
    this.compareSchemas(oldSchema, newSchema, "");
    return { diffs: this.diffs };
  }

  private compareSchemas(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    path: string
  ): void {
    if (oldSchema.type !== newSchema.type) {
      this.diffs.push({
        path,
        diffType: "TypeMismatch",
        oldValue: oldSchema.type,
        newValue: newSchema.type,
      });
    }

    if (oldSchema.type === "object" && newSchema.type === "object") {
      this.compareObjectProperties(
        oldSchema,
        newSchema,
        path
      );
    } else if (oldSchema.type === "array" && newSchema.type === "array") {
      this.compareArrayItems(oldSchema, newSchema, path);
    }
  }

  private compareObjectProperties(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    path: string
  ): void {
    const oldProps = oldSchema.properties || {};
    const newProps = newSchema.properties || {};
    const oldRequired = oldSchema.required || [];
    const newRequired = newSchema.required || [];

    const allKeys = new Set<string>([
      ...Object.keys(oldProps),
      ...Object.keys(newProps),
    ]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;

      if (!(key in oldProps)) {
        this.diffs.push({
          path: currentPath,
          diffType: "FieldAdded",
          oldValue: undefined,
          newValue: newSchema.properties![key],
        });
        continue;
      }

      if (!(key in newProps)) {
        this.diffs.push({
          path: currentPath,
          diffType: "FieldRemoved",
          oldValue: oldProps[key],
          newValue: undefined,
        });
        continue;
      }

      const oldProp = oldProps[key];
      const newProp = newProps[key];

      // Check required status change
      const wasRequired = oldRequired.includes(key);
      const isRequired = newRequired.includes(key);
      if (wasRequired !== isRequired) {
        this.diffs.push({
          path: currentPath,
          diffType: "RequiredStatusChange",
          oldValue: wasRequired,
          newValue: isRequired,
        });
      }

      // Recurse for deeper comparison
      this.compareSchemas(oldProp, newProp, currentPath);
    }
  }

  private compareArrayItems(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    path: string
  ): void {
    if (oldSchema.items && newSchema.items) {
      this.compareSchemas(
        oldSchema.items,
        newSchema.items,
        `${path}.items`
      );
    }
  }
}