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

export type SchemaDiffReport = {
  added: { path: string; description: string }[];
  removed: { path: string; description: string }[];
  changed: { path: string; description: string }[];
  compatible: { path: string; description: string }[];
};

interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "integer" | "object";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
}

export class SchemaDiffingV2 {
  private report: SchemaDiffReport = {
    added: [],
    removed: [],
    changed: [],
    compatible: [],
  };

  public getReport(): SchemaDiffReport {
    return this.report;
  }

  public diff(schemaA: SchemaDefinition, schemaB: SchemaDefinition): SchemaDiffReport {
    this.report = {
      added: [],
      removed: [],
      changed: [],
      compatible: [],
    };
    this.recursiveDiff(schemaA, schemaB, "");
    return this.report;
  }

  private recordDiff(
    path: string,
    type: "added" | "removed" | "changed" | "compatible",
    description: string
  ): void {
    switch (type) {
      case "added":
        this.report.added.push({ path, description });
        break;
      case "removed":
        this.report.removed.push({ path, description });
        break;
      case "changed":
        this.report.changed.push({ path, description });
        break;
      case "compatible":
        this.report.compatible.push({ path, description });
        break;
    }
  }

  private recursiveDiff(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    currentPath: string
  ): void {
    if (schemaA.type !== schemaB.type) {
      this.recordDiff(
        currentPath,
        "changed",
        `Type changed from ${schemaA.type} to ${schemaB.type}`
      );
      return;
    }

    if (schemaA.type === "object") {
      this.diffObjects(
        schemaA as SchemaDefinition & { properties: Record<string, SchemaDefinition> },
        schemaB as SchemaDefinition & { properties: Record<string, SchemaDefinition> },
        currentPath
      );
    } else if (schemaA.type === "array") {
      this.diffArrays(schemaA as SchemaDefinition & { items: SchemaDefinition }, schemaB as SchemaDefinition & { items: SchemaDefinition }, currentPath);
    } else {
      this.recordDiff(currentPath, "compatible", `Primitive type: ${schemaA.type}`);
    }
  }

  private diffObjects(
    schemaA: SchemaDefinition & { properties: Record<string, SchemaDefinition> },
    schemaB: SchemaDefinition & { properties: Record<string, SchemaDefinition> },
    currentPath: string
  ): void {
    const propsA = schemaA.properties || {};
    const propsB = schemaB.properties || {};
    const requiredA = schemaA.required || [];
    const requiredB = schemaB.required || [];

    const keysA = Object.keys(propsA);
    const keysB = Object.keys(propsB);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      const propA = propsA[key];
      const propB = propsB[key];

      const existsA = !!propA;
      const existsB = !!propB;

      if (existsA && !existsB) {
        this.recordDiff(path, "removed", `Property removed.`);
      } else if (!existsA && existsB) {
        this.recordDiff(path, "added", `Property added.`);
      } else if (existsA && existsB) {
        // Check required status change
        const requiredAStatus = requiredA.includes(key);
        const requiredBStatus = requiredB.includes(key);

        if (requiredAStatus !== requiredBStatus) {
          this.recordDiff(path, "changed", `Required status changed. A: ${requiredAStatus}, B: ${requiredBStatus}.`);
        }

        // Recurse for properties
        this.recursiveDiff(propA, propB, path);
      }
    }
  }

  private diffArrays(
    schemaA: SchemaDefinition & { items: SchemaDefinition },
    schemaB: SchemaDefinition & { items: SchemaDefinition },
    currentPath: string
  ): void {
    const itemsA = schemaA.items;
    const itemsB = schemaB.items;

    if (!itemsA || !itemsB) {
      this.recordDiff(currentPath, "changed", "Array item schema missing.");
      return;
    }

    this.recordDiff(currentPath, "compatible", "Array structure maintained.");
    this.recursiveDiff(itemsA, itemsB, `${currentPath}.items`);
  }
}