import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type SchemaDefinition = Record<string, FieldSchema>;

export enum DiffLevel {
  NONE = "none",
  MINOR = "minor",
  MAJOR = "major",
  SEMANTIC = "semantic",
}

export interface FieldSchema {
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface SchemaDiffReport {
  field: string;
  diffLevel: DiffLevel;
  description: string;
  details: Record<string, any>;
}

export interface StructuredToolOutputSchemaDiffingService {
  diffSchemas(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition
  ): {
    diffReport: SchemaDiffReport[];
    overallLevel: DiffLevel;
  };
}

export class SchemaDiffingService implements StructuredToolOutputSchemaDiffingService {
  diffSchemas(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition
  ): {
    diffReport: SchemaDiffReport[];
    overallLevel: DiffLevel;
  } {
    const diffReport: SchemaDiffReport[] = [];
    let maxLevel: DiffLevel = DiffLevel.NONE;

    const checkFieldDiff = (
      field: string,
      oldField: FieldSchema | undefined,
      newField: FieldSchema | undefined
    ): void => {
      let currentLevel: DiffLevel = DiffLevel.NONE;
      const report: SchemaDiffReport = {
        field: field,
        diffLevel: DiffLevel.NONE,
        description: "",
        details: {},
      };

      const hasOld = oldField !== undefined;
      const hasNew = newField !== undefined;

      if (!hasOld && hasNew) {
        report.description = "Field added.";
        report.diffLevel = DiffLevel.MINOR;
        currentLevel = DiffLevel.MINOR;
      } else if (hasOld && !hasNew) {
        report.description = "Field removed.";
        report.diffLevel = DiffLevel.MAJOR;
        currentLevel = DiffLevel.MAJOR;
      } else if (hasOld && hasNew) {
        const typeChanged = oldField.type !== newField.type;
        const requiredChanged = oldField.required !== newField.required;
        const defaultChanged = oldField.default !== newField.default;

        if (typeChanged) {
          report.description = `Type changed from ${oldField.type} to ${newField.type}.`;
          report.diffLevel = DiffLevel.MAJOR;
          currentLevel = DiffLevel.MAJOR;
        } else if (requiredChanged) {
          report.description = `Required status changed.`;
          report.diffLevel = DiffLevel.MINOR;
          currentLevel = DiffLevel.MINOR;
        } else if (defaultChanged) {
          report.description = "Default value changed.";
          report.diffLevel = DiffLevel.MINOR;
          currentLevel = DiffLevel.MINOR;
        } else {
          report.description = "Field structure appears stable.";
          report.diffLevel = DiffLevel.NONE;
        }
      }

      if (currentLevel > maxLevel) {
        maxLevel = currentLevel;
      }

      report.details = {
        old: oldField,
        new: newField,
      };
      diffReport.push(report);
    };

    // 1. Check for changes in existing and new fields
    for (const field in newSchema) {
      const fieldName = field as keyof SchemaDefinition;
      const newField = newSchema[fieldName];
      const oldField = oldSchema[fieldName];
      checkFieldDiff(fieldName, oldField, newField);
    }

    // 2. Check for removed fields (present in oldSchema but not in newSchema)
    for (const field in oldSchema) {
      const fieldName = field as keyof SchemaDefinition;
      if (!(fieldName in newSchema)) {
        const oldField = oldSchema[fieldName];
        const report: SchemaDiffReport = {
          field: fieldName,
          diffLevel: DiffLevel.MAJOR,
          description: "Field removed from the schema.",
          details: { old: oldField, new: undefined },
        };
        diffReport.push(report);
        if (DiffLevel.MAJOR > maxLevel) {
          maxLevel = DiffLevel.MAJOR;
        }
      }
    }

    return {
      diffReport,
      overallLevel: maxLevel,
    };
  }
}