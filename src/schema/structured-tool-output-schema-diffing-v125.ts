import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDiffReport {
  path: string;
  diffType: DiffType;
  details: any;
}

export enum DiffType {
  FieldMismatch = "FIELD_MISMATCH",
  TypeChange = "TYPE_CHANGE",
  MissingField = "MISSING_FIELD",
  ExtraField = "EXTRA_FIELD",
  RequiredChange = "REQUIRED_CHANGE",
}

export interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "any";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  optional?: boolean;
}

export class SchemaDiffer {
  private readonly report: SchemaDiffReport[] = [];

  public diff(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
  ): SchemaDiffReport[] {
    this.report = [];
    this.traverseAndDiff(schemaA, schemaB, "");
    return this.report;
  }

  private traverseAndDiff(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    path: string,
  ): void {
    if (schemaA.type !== schemaB.type) {
      this.report.push({
        path,
        diffType: DiffType.TypeChange,
        details: {
          from: schemaA.type,
          to: schemaB.type,
        },
      });
    }

    if (schemaA.type === "object" && schemaB.type === "object") {
      this.diffObjectProperties(
        schemaA as SchemaDefinition & { properties: Record<string, SchemaDefinition> },
        schemaB as SchemaDefinition & { properties: Record<string, SchemaDefinition> },
        path,
      );
    } else if (schemaA.type === "array" && schemaB.type === "array") {
      this.diffArrayItems(schemaA, schemaB, path);
    } else if (schemaA.type === "object" && schemaB.type !== "object") {
      this.report.push({
        path,
        diffType: DiffType.TypeChange,
        details: {
          from: "object",
          to: schemaB.type,
        },
      });
    } else if (schemaA.type !== "object" && schemaB.type === "object") {
      this.report.push({
        path,
        diffType: DiffType.TypeChange,
        details: {
          from: schemaA.type,
          to: "object",
        },
      });
    }
  }

  private diffObjectProperties(
    schemaA: SchemaDefinition & { properties: Record<string, SchemaDefinition> },
    schemaB: SchemaDefinition & { properties: Record<string, SchemaDefinition> },
    path: string,
  ): void {
    const propsA = schemaA.properties || {};
    const propsB = schemaB.properties || {};
    const keysA = Object.keys(propsA);
    const keysB = Object.keys(propsB);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const propA = propsA[key];
      const propB = propsB[key];

      if (!propsA[key] && propsB[key]) {
        this.report.push({
          path: currentPath,
          diffType: DiffType.ExtraField,
          details: {
            description: "Field added in schema B.",
            schemaB: propB,
          },
        });
      } else if (propsA[key] && !propsB[key]) {
        this.report.push({
          path: currentPath,
          diffType: DiffType.MissingField,
          details: {
            description: "Field removed in schema B.",
            schemaA: propA,
          },
        });
      } else if (propsA[key] && propsB[key]) {
        this.diffObjectProperties(propA, propB, currentPath);
      }
    }

    this.checkRequiredChanges(schemaA, schemaB, path);
  }

  private checkRequiredChanges(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    path: string,
  ): void {
    const requiredA = schemaA.required || [];
    const requiredB = schemaB.required || [];
    const propertiesA = schemaA.properties || {};
    const propertiesB = schemaB.properties || {};

    // Check for required status changes on existing fields
    for (const key of Object.keys(propertiesA).filter(
      (key) => propertiesB[key] !== undefined,
    )) {
      const currentPath = path ? `${path}.${key}` : key;
      const isRequiredA = requiredA.includes(key);
      const isRequiredB = requiredB.includes(key);

      if (isRequiredA && !isRequiredB) {
        this.report.push({
          path: currentPath,
          diffType: DiffType.RequiredChange,
          details: {
            description: "Field changed from required to optional.",
          },
        });
      } else if (!isRequiredA && isRequiredB) {
        this.report.push({
          path: currentPath,
          diffType: DiffType.RequiredChange,
          details: {
            description: "Field changed from optional to required.",
          },
        });
      }
    }
  }

  private diffArrayItems(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    path: string,
  ): void {
    const itemsA = schemaA.items as SchemaDefinition;
    const itemsB = schemaB.items as SchemaDefinition;

    if (itemsA && itemsB) {
      this.traverseAndDiff(itemsA, itemsB, `${path}[]`);
    }
  }
}

export { SchemaDiffer };