import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaField = {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, SchemaField>;
  items?: {
    type: string;
    properties?: Record<string, SchemaField>;
  };
};

type Schema = {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
};

type DiffReport = {
  path: string;
  diffs: string[];
};

export class SchemaDiffer {
  private report: DiffReport[] = [];

  private addDiff(path: string, diff: string): void {
    this.report.push({ path, diffs: [diff] });
  }

  private addDiff(path: string, diffs: string[]): void {
    this.report.push({ path, diffs });
  }

  private compareSchemas(
    currentSchema: SchemaField,
    targetSchema: SchemaField,
    path: string
  ): void {
    const diffs: string[] = [];

    // 1. Compare Type
    if (currentSchema.type !== targetSchema.type) {
      diffs.push(`Type changed from '${currentSchema.type}' to '${targetSchema.type}'`);
    }

    // 2. Compare Required Status (Simplified: assuming boolean for required)
    const currentRequired = currentSchema.required ?? true;
    const targetRequired = targetSchema.required ?? true;
    if (currentRequired !== targetRequired) {
      diffs.push(`Required status changed from ${currentRequired} to ${targetRequired}`);
    }

    // 3. Compare Enum Values
    const currentEnum = currentSchema.enum;
    const targetEnum = targetSchema.enum;
    if (currentEnum && targetEnum) {
      if (currentEnum.length !== targetEnum.length) {
        diffs.push(`Enum length changed from ${currentEnum.length} to ${targetEnum.length}`);
      } else {
        const currentSet = new Set(currentEnum);
        const targetSet = new Set(targetEnum);
        for (const value of currentEnum) {
          if (!targetSet.has(value)) {
            diffs.push(`Enum value '${value}' removed`);
          }
        }
        for (const value of targetEnum) {
          if (!currentSet.has(value)) {
            diffs.push(`Enum value '${value}' added`);
          }
        }
      }
    } else if (currentEnum !== targetEnum) {
      diffs.push(`Enum changed from ${currentEnum ? `[${currentEnum.join(', ')}]` : 'none'} to ${targetEnum ? `[${targetEnum.join(', ')}]` : 'none'}`);
    }

    // 4. Compare Properties (Object)
    const currentProps = currentSchema.properties || {} as Record<string, SchemaField>;
    const targetProps = targetSchema.properties || {} as Record<string, SchemaField>;

    const allKeys = new Set([...Object.keys(currentProps), ...Object.keys(targetProps)]);

    for (const key of allKeys) {
      const currentProp = currentProps[key];
      const targetProp = targetProps[key];
      const nextPath = `${path}.${key}`;

      if (!currentProp && targetProp) {
        diffs.push(`Field '${key}' added (Type: ${targetProp.type})`);
      } else if (currentProp && !targetProp) {
        diffs.push(`Field '${key}' removed`);
      } else if (currentProp && targetProp) {
        this.compareSchemas(currentProp, targetProp, nextPath);
        // Recursively check nested properties
        if (currentProp.properties && targetProp.properties) {
          this.compareObjectProperties(currentProp.properties, targetProp.properties, nextPath);
        }
        // Check array items if applicable
        if (currentProp.items && targetProp.items) {
          this.compareArrayItems(currentProp.items, targetProp.items, nextPath);
        }
      }
    }

    // 5. Handle nested object properties comparison (if properties exist)
    if (currentSchema.properties && targetSchema.properties) {
      this.compareObjectProperties(
        currentSchema.properties,
        targetSchema.properties,
        path
      );
    }

    // 6. Handle array items comparison
    if (currentSchema.items && targetSchema.items) {
      this.compareArrayItems(
        currentSchema.items,
        targetSchema.items,
        path
      );
    }
  }

  private compareObjectProperties(
    currentProps: Record<string, SchemaField>,
    targetProps: Record<string, SchemaField>,
    path: string
  ): void {
    const allKeys = new Set([...Object.keys(currentProps), ...Object.keys(targetProps)]);

    for (const key of allKeys) {
      const currentProp = currentProps[key];
      const targetProp = targetProps[key];
      const nextPath = `${path}.${key}`;

      if (!currentProp && targetProp) {
        this.addDiff(nextPath, `Field '${key}' added (Type: ${targetProp.type})`);
      } else if (currentProp && !targetProp) {
        this.addDiff(nextPath, `Field '${key}' removed`);
      } else if (currentProp && targetProp) {
        this.compareSchemas(currentProp, targetProp, nextPath);
      }
    }
  }

  private compareArrayItems(
    currentItems: {
      type: string;
      properties?: Record<string, SchemaField>;
    },
    targetItems: {
      type: string;
      properties?: Record<string, SchemaField>;
    },
    path: string
  ): void {
    if (currentItems.type !== targetItems.type) {
      this.addDiff(path, `Array item type changed from '${currentItems.type}' to '${targetItems.type}'`);
    }

    if (currentItems.properties && targetItems.properties) {
      this.compareObjectProperties(
        currentItems.properties,
        targetItems.properties,
        `${path}.items`
      );
    }
  }

  public diff(currentSchema: SchemaField, targetSchema: SchemaField): DiffReport[] {
    this.report = [];
    this.compareSchemas(currentSchema, targetSchema, "root");
    return this.report;
  }
}