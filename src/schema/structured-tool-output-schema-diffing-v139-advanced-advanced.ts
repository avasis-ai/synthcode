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
  diffType: "TypeMismatch" | "StructuralChange" | "MissingField" | "ExtraField" | "TypeMismatch";
  message: string;
  details?: any;
};

export type SchemaDiffResult = {
  diffs: SchemaDiffReport[];
  isDifferent: boolean;
};

type Schema = Record<string, any>;

const getTypeName = (value: any): string => {
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return "array";
    }
    return Object.keys(value).length > 0 ? "object" : "empty_object";
  }
  return typeof value;
};

const compareSchemasRecursive = (
  path: string,
  schemaA: any,
  schemaB: any,
  diffs: SchemaDiffReport[]
): void => {
  const typeA = getTypeName(schemaA);
  const typeB = getTypeName(schemaB);

  if (typeA !== typeB) {
    diffs.push({
      path,
      diffType: "StructuralChange",
      message: `Type mismatch at path '${path}'. Schema A is '${typeA}', but Schema B is '${typeB}'.`,
      details: { schemaA, schemaB },
    });
    return;
  }

  if (typeA === "object") {
    const keysA = Object.keys(schemaA);
    const keysB = Object.keys(schemaB);

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const schemaAValue = schemaA[key];
      const schemaBValue = schemaB[key];

      if (!(key in schemaA)) {
        diffs.push({
          path: currentPath,
          diffType: "MissingField",
          message: `Field '${key}' is missing in Schema A.`,
        });
        continue;
      }

      if (!(key in schemaB)) {
        diffs.push({
          path: currentPath,
          diffType: "ExtraField",
          message: `Field '${key}' is extra in Schema B.`,
        });
        continue;
      }

      const typeAValue = getTypeName(schemaAValue);
      const typeBValue = getTypeName(schemaBValue);

      if (typeAValue !== typeBValue) {
        diffs.push({
          path: currentPath,
          diffType: "StructuralChange",
          message: `Type mismatch at path '${currentPath}'. Schema A type: '${typeAValue}', Schema B type: '${typeBValue}'.`,
          details: { schemaA: schemaAValue, schemaB: schemaBValue },
        });
        continue;
      }

      if (typeAValue === "object" && typeAValue !== "array") {
        compareSchemasRecursive(currentPath, schemaAValue, schemaBValue, diffs);
      } else if (typeAValue === "array") {
        // Simple array comparison: assume structure consistency if both are arrays
        // For advanced diffing, one might check item schemas, but here we check array structure itself.
        if (typeof schemaAValue !== 'object' || schemaAValue === null || !Array.isArray(schemaAValue)) {
             diffs.push({
                path: currentPath,
                diffType: "StructuralChange",
                message: `Expected array structure at '${currentPath}', but found ${typeof schemaAValue}.`,
            });
        } else if (typeof schemaBValue !== 'object' || schemaBValue === null || !Array.isArray(schemaBValue)) {
             diffs.push({
                path: currentPath,
                diffType: "StructuralChange",
                message: `Expected array structure at '${currentPath}', but found ${typeof schemaBValue}.`,
            });
        }
      }
    }
  } else if (typeA === "string" && typeB === "string") {
    // Primitive type comparison (e.g., string vs string) - no diff needed unless content comparison is required
  }
};

export const diffStructuredSchemas = (
  schemaA: Schema,
  schemaB: Schema
): SchemaDiffResult => {
  const diffs: SchemaDiffReport[] = [];
  compareSchemasRecursive("", schemaA, schemaB, diffs);

  const isDifferent = diffs.length > 0;

  return { diffs, isDifferent };
};