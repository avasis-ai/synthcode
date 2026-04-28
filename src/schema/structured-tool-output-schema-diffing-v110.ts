import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

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

export type StructuredSchema = Record<string, any>;

export type FieldDiff = {
  type: "added" | "removed" | "changed" | "unchanged";
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
};

export type StructuredDiff = Record<string, FieldDiff>;

export interface DiffResult {
  schema: StructuredSchema;
  diff: StructuredDiff;
}

export class StructuredToolOutputDiffingService {
  private history: Map<string, {
    schema: StructuredSchema;
    output: Record<string, unknown>;
  }> = new Map();

  private readonly HISTORY_LIMIT: number = 10;

  private getHistoryKey(schema: StructuredSchema): string {
    return JSON.stringify(schema);
  }

  private getHistoryEntry(schema: StructuredSchema): {
    schema: StructuredSchema;
    output: Record<string, unknown>;
  } | undefined {
    const key = this.getHistoryKey(schema);
    return this.history.get(key);
  }

  private updateHistory(schema: StructuredSchema, output: Record<string, unknown>): void {
    const key = this.getHistoryKey(schema);
    this.history.set(key, { schema, output });

    if (this.history.size > this.HISTORY_LIMIT) {
      const oldestKey = this.history.keys().next().value;
      this.history.delete(oldestKey);
    }
  }

  private deepDiff(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    schema: StructuredSchema,
    path: string = ""
  ): StructuredDiff {
    const diff: StructuredDiff = {};
    const allKeys = new Set<string>([
      ...Object.keys(oldObj),
      ...Object.keys(newObj),
    ]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = oldObj[key];
      const newValue = newObj[key];
      const schemaType = schema[key]?.type;

      if (schemaType === undefined) {
        continue;
      }

      if (oldValue === undefined && newValue === undefined) {
        continue;
      }

      let fieldDiff: FieldDiff;

      if (oldValue === undefined && newValue !== undefined) {
        fieldDiff = { type: "added", newValue };
      } else if (oldValue !== undefined && newValue === undefined) {
        fieldDiff = { type: "removed", oldValue };
      } else if (typeof oldValue === "object" && oldValue !== null && typeof newValue === "object" && newValue !== null) {
        fieldDiff = this.deepDiff(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>,
          schema[key] as StructuredSchema,
          currentPath
        );
        if (Object.keys(fieldDiff).length > 0) {
          diff[key] = fieldDiff;
        } else {
          diff[key] = { type: "unchanged" };
        }
      } else if (oldValue !== newValue) {
        fieldDiff = { type: "changed", oldValue, newValue };
      } else {
        fieldDiff = { type: "unchanged" };
      }

      if (fieldDiff.type !== "unchanged") {
        diff[key] = fieldDiff;
      }
    }
    return diff;
  }

  public diffOutput(
    schema: StructuredSchema,
    currentOutput: Record<string, unknown>
  ): DiffResult {
    const previousEntry = this.getHistoryEntry(schema);

    let diff: StructuredDiff = {};

    if (previousEntry) {
      diff = this.deepDiff(
        previousEntry.output,
        currentOutput,
        schema
      );
    } else {
      diff = {};
    }

    const result: DiffResult = {
      schema,
      diff: diff,
    };

    this.updateHistory(schema, currentOutput);
    return result;
  }
}