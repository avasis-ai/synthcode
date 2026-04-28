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

type SchemaField = {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required?: boolean;
  properties?: Record<string, SchemaField>;
  items?: {
    type: "string" | "number" | "boolean";
  };
};

type Schema = {
  type: "object";
  properties: Record<string, SchemaField>;
  required?: string[];
};

type DiffReport = {
  added: { field: string; diff: any }[];
  removed: { field: string; diff: any }[];
  modified: { field: string; diff: any }[];
};

type FieldDiff = {
  type: "type_change" | "required_change" | "property_change";
  details: any;
};

export class StructuredToolOutputSchemaDiffing {
  private diffReport: DiffReport = {
    added: [],
    removed: [],
    modified: [],
  };

  private currentSchema: Schema;
  private previousSchema: Schema;

  constructor(currentSchema: Schema, previousSchema: Schema) {
    this.currentSchema = currentSchema;
    this.previousSchema = previousSchema;
  }

  private compareProperties(
    currentProps: Record<string, SchemaField>;
    previousProps: Record<string, SchemaField>;
    path: string;
  ): void {
    const allKeys = new Set<string>([
      ...Object.keys(currentProps),
      ...Object.keys(previousProps),
    ]);

    for (const key of allKeys) {
      const currentField = currentProps[key];
      const previousField = previousProps[key];
      const currentPath = `${path}.${key}`;

      if (!previousField) {
        this.diffReport.added.push({
          field: currentPath,
          diff: {
            type: "added",
            details: {
              field: key,
              schema: currentField,
            },
          },
        });
        continue;
      }

      if (!currentField) {
        this.diffReport.removed.push({
          field: currentPath,
          diff: {
            type: "removed",
            details: {
              field: key,
              schema: previousField,
            },
          },
        });
        continue;
      }

      // Field exists in both, check for modifications
      const fieldDiff = this.compareFields(
        currentField,
        previousField,
        currentPath,
      );

      if (fieldDiff) {
        if (fieldDiff.type === "type_change" || fieldDiff.type === "required_change" || fieldDiff.type === "property_change") {
          this.diffReport.modified.push({
            field: currentPath,
            diff: {
              type: "modified",
              details: fieldDiff,
            },
          });
        }
      }
    }
  }

  private compareFields(
    current: SchemaField;
    previous: SchemaField;
    path: string,
  ): FieldDiff | null {
    let diff: FieldDiff | null = null;

    // 1. Check required status change
    const currentRequired = current.required === true;
    const previousRequired = previous.required === true;
    if (currentRequired !== previousRequired) {
      diff = {
        type: "required_change",
        details: {
          field: path.split('.').pop()!,
          was_required: previousRequired,
          is_required: currentRequired,
        },
      };
    }

    // 2. Check type change
    if (current.type !== previous.type) {
      diff = {
        type: "type_change",
        details: {
          field: path.split('.').pop()!,
          old_type: previous.type,
          new_type: current.type,
        },
      };
    }

    // 3. Check properties (for object types)
    if (current.type === "object" && previous.type === "object") {
      const currentProps = current.properties || {} as Record<string, SchemaField>;
      const previousProps = previous.properties || {} as Record<string, SchemaField>;

      this.compareProperties(currentProps, previousProps, path);

      // If properties changed, we mark it as a property change, even if individual changes were handled above.
      // This ensures the user knows the structure changed deeply.
      if (Object.keys(currentProps).length !== Object.keys(previousProps).length ||
          Object.keys(currentProps).some(key => !previousProps[key]) ||
          Object.keys(previousProps).some(key => !currentProps[key])) {
        diff = {
          type: "property_change",
          details: {
            field: path.split('.').pop()!,
            message: "Object structure changed. Check added/removed/modified sections for details.",
          },
        };
      }
    }

    return diff;
  }

  public generateReport(): {
    summary: string;
    diff: Record<string, any>;
  } {
    const totalDiffs = this.diffReport.added.length + this.diffReport.removed.length + this.diffReport.modified.length;

    const summary = `Schema Diff Report Summary:\n- Total Changes Detected: ${totalDiffs}\n- Fields Added: ${this.diffReport.added.length}\n- Fields Removed: ${this.diffReport.removed.length}\n- Fields Modified: ${this.diffReport.modified.length}`;

    return {
      summary: summary,
      diff: {
        added: this.diffReport.added,
        removed: this.diffReport.removed,
        modified: this.diffReport.modified,
      },
    };
  }
}