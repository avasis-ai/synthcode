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

interface SchemaDefinition {
  type: "object";
  properties: Record<string, SchemaDefinition>;
  required?: string[];
}

interface FieldDiff {
  type: "added" | "removed" | "modified";
  details: any;
}

interface SchemaDiffReport {
  added: Record<string, any>[];
  removed: Record<string, any>[];
  modified: Record<string, any>[];
}

type SchemaDiffResult = {
  report: SchemaDiffReport;
  diff: Record<string, FieldDiff>;
};

const createInitialReport = (): SchemaDiffReport => ({
  added: [],
  removed: [],
  modified: [],
});

const compareSchemas = (
  schemaA: SchemaDefinition,
  schemaB: SchemaDefinition,
  path: string = "",
): SchemaDiffResult => {
  const report = createInitialReport();
  const diff: Record<string, FieldDiff> = {};

  const propertiesA = schemaA.properties || {};
  const propertiesB = schemaB.properties || {};
  const requiredA = schemaA.required || [];
  const requiredB = schemaB.required || [];

  const allKeys = new Set<string>([
    ...Object.keys(propertiesA),
    ...Object.keys(propertiesB),
  ]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const propA = propertiesA[key];
    const propB = propertiesB[key];

    if (!propertiesA[key] && propertiesB[key]) {
      diff[key] = {
        type: "added",
        details: {
          path: currentPath,
          description: `Field '${key}' added.`,
          newSchema: propB,
        },
      };
      report.added.push({
        field: key,
        details: {
          path: currentPath,
          description: `Field '${key}' added.`,
          newSchema: propB,
        },
      });
    } else if (propertiesA[key] && !propertiesB[key]) {
      diff[key] = {
        type: "removed",
        details: {
          path: currentPath,
          description: `Field '${key}' removed.`,
          oldSchema: propA,
        },
      };
      report.removed.push({
        field: key,
        details: {
          path: currentPath,
          description: `Field '${key}' removed.`,
          oldSchema: propA,
        },
      });
    } else if (propertiesA[key] && propertiesB[key]) {
      const subDiff = compareSchemas(
        propertiesA[key],
        propertiesB[key],
        currentPath,
      );

      if (subDiff.report.added.length > 0 ||
        subDiff.report.removed.length > 0 ||
        subDiff.report.modified.length > 0) {
        diff[key] = {
          type: "modified",
          details: {
            path: currentPath,
            description: "Nested structure changed.",
            subDiff: subDiff,
          },
        };
        report.modified.push({
          field: key,
          details: {
            path: currentPath,
            description: "Nested structure changed.",
            subDiff: subDiff,
          },
        });
      } else {
        diff[key] = { type: "unchanged", details: {} };
      }
    }
  }

  return { report, diff };
};

export const diffStructuredToolOutputSchema = (
  schemaA: SchemaDefinition,
  schemaB: SchemaDefinition,
): SchemaDiffResult => {
  return compareSchemas(schemaA, schemaB);
};