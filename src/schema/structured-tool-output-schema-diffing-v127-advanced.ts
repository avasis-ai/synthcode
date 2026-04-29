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

export type SchemaField = {
  type: string;
  description: string;
  required: boolean;
  schema?: Record<string, any>;
};

export type StructuredSchema = Record<string, SchemaField>;

export type DiffReport = {
  path: string;
  diff: {
    type: "MISSING" | "ADDED" | "CHANGED" | "SAME";
    details?: any;
    suggestion?: string;
  }[];
};

type SchemaDiffResult = {
  report: DiffReport;
  compatible: boolean;
};

const getFieldType = (field: SchemaField): string => {
  if (field.schema) {
    return "object";
  }
  return field.type;
};

const compareSchemas = (
  path: string,
  schemaA: StructuredSchema,
  schemaB: StructuredSchema
): SchemaDiffResult => {
  const report: DiffReport = [];
  const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);

  for (const key of allKeys) {
    const fieldA = schemaA[key];
    const fieldB = schemaB[key];

    if (!fieldA && fieldB) {
      report.push({
        path: `${path}.${key}`,
        diff: [{
          type: "ADDED",
          details: {
            schema: fieldB,
          },
          suggestion: `Field '${key}' added. Consider updating consumers to handle this new field.`,
        }],
      });
      continue;
    }

    if (fieldA && !fieldB) {
      report.push({
        path: `${path}.${key}`,
        diff: [{
          type: "MISSING",
          details: {
            schema: fieldA,
          },
          suggestion: `Field '${key}' removed. Consumers relying on this field will break.`,
        }],
      });
      continue;
    }

    if (fieldA && fieldB) {
      const typeA = getFieldType(fieldA);
      const typeB = getFieldType(fieldB);
      const isRequiredA = fieldA.required;
      const isRequiredB = fieldB.required;

      if (typeA !== typeB || isRequiredA !== isRequiredB) {
        report.push({
          path: `${path}.${key}`,
          diff: [{
            type: "CHANGED",
            details: {
              old_type: typeA,
              new_type: typeB,
              old_required: isRequiredA,
              new_required: isRequiredB,
            },
            suggestion: `Type or required status changed. Review compatibility.`,
          }],
        });
      } else if (typeA === "object" && fieldA.schema && fieldB.schema) {
        const subResult = compareSchemas(
          `${path}.${key}`,
          fieldA.schema,
          fieldB.schema
        );
        report.push({
          path: `${path}.${key}`,
          diff: subResult.report.map(r => ({
            path: r.path,
            diff: r.diff,
          })),
        });
      }
    }
  }

  const compatible = report.every(r => r.diff.every(d => d.type !== "CHANGED"));

  return { report, compatible };
};

export const diffStructuredToolOutputSchema = (
  schemaA: StructuredSchema,
  schemaB: StructuredSchema
): SchemaDiffResult => {
  return compareSchemas("root", schemaA, schemaB);
};