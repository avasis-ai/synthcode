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
  path: string;
  diffs: {
    type: "TypeMismatch" | "RequiredFieldRemoved" | "NestedStructureChanged" | "ValueChange";
    message: string;
    details?: any;
  }[];
};

export interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "integer";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
}

export class SchemaDiffingService {
  private readonly initialReport: SchemaDiffReport = {
    path: "",
    diffs: [],
  };

  public calculateDiff(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
  ): SchemaDiffReport {
    const initialReport: SchemaDiffReport = {
      path: "",
      diffs: [],
    };
    return this.recursiveDiff(schemaA, schemaB, initialReport);
  }

  private recursiveDiff(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    currentReport: SchemaDiffReport,
  ): SchemaDiffReport {
    const newReport: SchemaDiffReport = {
      path: currentReport.path,
      diffs: [...currentReport.diffs],
    };

    if (schemaA.type !== schemaB.type) {
      newReport.diffs.push({
        type: "TypeMismatch",
        message: `Schema type mismatch at path ${currentReport.path}. Expected ${
          schemaA.type || "unknown"
        }, found ${schemaB.type || "unknown"}`,
        details: {
          schemaA: schemaA.type,
          schemaB: schemaB.type,
        },
      });
    }

    if (schemaA.type === "object" && schemaB.type === "object") {
      const propertiesA = schemaA.properties || {};
      const propertiesB = schemaB.properties || {};
      const requiredA = schemaA.required || [];
      const requiredB = schemaB.required || [];

      const allKeys = new Set([
        ...Object.keys(propertiesA),
        ...Object.keys(propertiesB),
      ]);

      for (const key of allKeys) {
        const path = `${currentReport.path}.${key}`;
        const propA = propertiesA[key];
        const propB = propertiesB[key];

        if (propA && !propB) {
          newReport.diffs.push({
            type: "RequiredFieldRemoved",
            message: `Property '${key}' removed from schema at path ${path}.`,
            details: {
              originalSchema: propA,
            },
          });
        } else if (!propA && propB) {
          newReport.diffs.push({
            type: "RequiredFieldAdded",
            message: `Property '${key}' added to schema at path ${path}.`,
            details: {
              newSchema: propB,
            },
          });
        } else if (propA && propB) {
          // Check for structural changes in properties
          const childReport = this.recursiveDiff(propA, propB, {
            path: path,
            diffs: [],
          });
          newReport.diffs.push(...childReport.diffs);
        }
      }

      // Check required field changes
      const missingRequired = requiredA.filter(
        (key) => !propertiesB[key]
      );
      if (missingRequired.length > 0) {
        newReport.diffs.push({
          type: "RequiredFieldRemoved",
          message: `Required field(s) removed: ${missingRequired.join(", ")} at path ${currentReport.path}.`,
          details: {
            removedFields: missingRequired,
          },
        });
      }

      const addedRequired = requiredB.filter(
        (key) => !propertiesA[key]
      );
      if (addedRequired.length > 0) {
        newReport.diffs.push({
          type: "RequiredFieldAdded",
          message: `Required field(s) added: ${addedRequired.join(", ")} at path ${currentReport.path}.`,
          details: {
            addedFields: addedRequired,
          },
        });
      }
    } else if (schemaA.type === "array" && schemaB.type === "array") {
      if (schemaA.items && schemaB.items) {
        const childReport = this.recursiveDiff(
          schemaA.items,
          schemaB.items,
          {
            path: `${currentReport.path}.items`,
            diffs: [],
          },
        );
        newReport.diffs.push(...childReport.diffs);
      }
    }

    return newReport;
  }
}