import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface SchemaField {
  type: "string" | "number" | "boolean" | "array" | "object" | "enum";
  description?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  items?: SchemaField | { type: "object"; properties: Record<string, SchemaField> };
  enumValues?: string[];
  properties?: Record<string, SchemaField>;
}

export interface DiffReport {
  path: string;
  diff: {
    oldValue: unknown;
    newValue: unknown;
    changeType: "typeChange" | "constraintChange" | "structuralChange" | "valueChange";
    description: string;
  }[];
}

type Schema = Record<string, SchemaField>;

interface SchemaDiffingService {
  compareSchemas(oldSchema: Schema, newSchema: Schema): DiffReport[];
}

class SchemaDiffingServiceImplementation implements SchemaDiffingService {
  compareSchemas(oldSchema: Schema, newSchema: Schema): DiffReport[] {
    const diffs: DiffReport[] = [];
    this.deepCompare(oldSchema, newSchema, "", diffs);
    return diffs;
  }

  private deepCompare(
    oldSchema: SchemaField,
    newSchema: SchemaField,
    path: string,
    diffs: DiffReport[]
  ): void {
    if (oldSchema.type !== newSchema.type) {
      diffs.push({
        path: path,
        diff: [{
          oldValue: oldSchema.type,
          newValue: newSchema.type,
          changeType: "typeChange",
          description: `Root type changed from ${oldSchema.type} to ${newSchema.type}.`,
        }],
      });
    }

    if (oldSchema.type === "object" && newSchema.type === "object") {
      this.compareObjectProperties(
        oldSchema as any,
        newSchema as any,
        path,
        diffs
      );
    } else if (oldSchema.type === "array" && newSchema.type === "array") {
      this.compareArrayItems(
        oldSchema as any,
        newSchema as any,
        path,
        diffs
      );
    } else if (oldSchema.type === "string" && newSchema.type === "string") {
      this.compareStringConstraints(
        oldSchema as any,
        newSchema as any,
        path,
        diffs
      );
    } else if (oldSchema.type === "enum" && newSchema.type === "enum") {
      this.compareEnumValues(
        oldSchema as any,
        newSchema as any,
        path,
        diffs
      );
    }
  }

  private compareObjectProperties(
    oldSchema: SchemaField,
    newSchema: SchemaField,
    path: string,
    diffs: DiffReport[]
  ): void {
    const oldProps = oldSchema.properties || {};
    const newProps = newSchema.properties || {};
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const oldProp = oldProps[key];
      const newProp = newProps[key];

      if (!oldProp && newProp) {
        diffs.push({
          path: currentPath,
          diff: [{
            oldValue: undefined,
            newValue: newProp.type,
            changeType: "structuralChange",
            description: `Field added: ${key} (${newProp.type}).`,
          }],
        });
      } else if (oldProp && !newProp) {
        diffs.push({
          path: currentPath,
          diff: [{
            oldValue: oldProp.type,
            newValue: undefined,
            changeType: "structuralChange",
            description: `Field removed: ${key}.`,
          }],
        });
      } else if (oldProp && newProp) {
        this.deepCompare(oldProp, newProp, currentPath, diffs);
      }
    }
  }

  private compareArrayItems(
    oldSchema: SchemaField,
    newSchema: SchemaField,
    path: string,
    diffs: DiffReport[]
  ): void {
    const oldItems = (oldSchema as any).items;
    const newItems = (newSchema as any).items;

    if (!oldItems || !newItems) return;

    if (typeof oldItems === 'object' && 'properties' in oldItems && typeof newItems === 'object' && 'properties' in newItems) {
      // Comparing object items (e.g., array of objects)
      this.compareObjectProperties(
        oldItems as SchemaField,
        newItems as SchemaField,
        `${path}.items.properties`,
        diffs
      );
    } else {
      // Comparing primitive/simple item types
      this.deepCompare(
        oldItems,
        newItems,
        `${path}.items`,
        diffs
      );
    }
  }

  private compareStringConstraints(
    oldSchema: SchemaField,
    newSchema: SchemaField,
    path: string,
    diffs: DiffReport[]
  ): void {
    const constraints: {
      key: keyof SchemaField;
      oldValue: unknown;
      newValue: unknown;
      changeType: "constraintChange";
      description: string;
    }[] = [];

    if (oldSchema.minLength !== undefined && newSchema.minLength !== undefined && oldSchema.minLength !== newSchema.minLength) {
      constraints.push({
        key: "minLength",
        oldValue: oldSchema.minLength,
        newValue: newSchema.minLength,
        changeType: "constraintChange",
        description: `Min length changed from ${oldSchema.minLength} to ${newSchema.minLength}.`,
      });
    }
    if (oldSchema.maxLength !== undefined && newSchema.maxLength !== undefined && oldSchema.maxLength !== newSchema.maxLength) {
      constraints.push({
        key: "maxLength",
        oldValue: oldSchema.maxLength,
        newValue: newSchema.maxLength,
        changeType: "constraintChange",
        description: `Max length changed from ${oldSchema.maxLength} to ${newSchema.maxLength}.`,
      });
    }
    if (oldSchema.pattern !== undefined && newSchema.pattern !== undefined && oldSchema.pattern !== newSchema.pattern) {
      constraints.push({
        key: "pattern",
        oldValue: oldSchema.pattern,
        newValue: newSchema.pattern,
        changeType: "constraintChange",
        description: `Regex pattern changed from ${oldSchema.pattern} to ${newSchema.pattern}.`,
      });
    }

    if (constraints.length > 0) {
      diffs.push({
        path: path,
        diff: constraints.map((c) => ({
          oldValue: c.oldValue,
          newValue: c.newValue,
          changeType: c.changeType,
          description: c.description,
        })),
      });
    }
  }

  private compareEnumValues(
    oldSchema: SchemaField,
    newSchema: SchemaField,
    path: string,
    diffs: DiffReport[]
  ): void {
    const oldValues = oldSchema.enumValues || [];
    const newValues = newSchema.enumValues || [];

    const oldSet = new Set(oldValues);
    const newSet = new Set(newValues);

    const removed = Array.from(oldSet).filter((value) => !newSet.has(value));
    const added = Array.from(newSet).filter((value) => !oldSet.has(value));

    if (removed.length > 0 || added.length > 0) {
      const diff: DiffReport['diff'][];
      if (removed.length > 0 && added.length > 0) {
        diff = [{
          oldValue: removed,
          newValue: added,
          changeType: "structuralChange",
          description: `Enum values changed. Removed: ${removed.join(', ')}. Added: ${added.join(', ')}.`,
        }];
      } else if (removed.length > 0) {
        diff = [{
          oldValue: removed,
          newValue: undefined,
          changeType: "structuralChange",
          description: `Enum values removed: ${removed.join(', ')}.`,
        }];
      } else {
        diff = [{
          oldValue: undefined,
          newValue: added,
          changeType: "structuralChange",
          description: `Enum values added: ${added.join(', ')}.`,
        }];
      }
      diffs.push({ path: path, diff: diff });
    }
  }
}

export const structuredToolOutputSchemaDiffingService: SchemaDiffingService = new SchemaDiffingServiceImplementation();