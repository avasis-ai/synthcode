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

type SchemaDefinition = Record<string, unknown>;

type Severity = "error" | "warning" | "info";

export interface SchemaDiffReport {
  path: string;
  severity: Severity;
  description: string;
  expected?: unknown;
  actual?: unknown;
}

export class SchemaDiffingUtility {
  private report: SchemaDiffReport[] = [];

  private addDiff(path: string, severity: Severity, description: string, expected?: unknown, actual?: unknown): void {
    this.report.push({
      path,
      severity,
      description,
      expected,
      actual,
    });
  }

  public diff(expectedSchema: SchemaDefinition, actualSchema: SchemaDefinition): SchemaDiffReport[] {
    this.report = [];
    this.compareSchemas(expectedSchema, actualSchema, "");
    return this.report;
  }

  private compareSchemas(expected: unknown, actual: unknown, path: string): void {
    if (typeof expected !== "object" || expected === null || typeof actual !== "object" || actual === null) {
      if (expected !== actual) {
        this.addDiff(
          path,
          "error",
          "Type mismatch: Expected object, got primitive or null.",
          expected,
          actual,
        );
      }
      return;
    }

    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);

    // Check for missing keys in actual schema
    for (const key of expectedKeys) {
      if (!(key in actual)) {
        this.addDiff(
          `${path}.${key}`,
          "error",
          `Missing required field in actual schema.`,
          expected[key],
          undefined,
        );
      }
    }

    // Check for extra keys in actual schema
    for (const key of actualKeys) {
      if (!(key in expected)) {
        this.addDiff(
          `${path}.${key}`,
          "warning",
          `Unexpected field found in actual schema.`,
          undefined,
          actual[key],
        );
      }
    }

    // Deep comparison for common keys
    const commonKeys = new Set([...expectedKeys, ...actualKeys]);
    for (const key of commonKeys) {
      const newPath = path ? `${path}.${key}` : key;
      const expectedValue = (expected as Record<string, unknown>)[key];
      const actualValue = (actual as Record<string, unknown>)[key];

      if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
        this.compareArrays(expectedValue, actualValue, newPath);
      } else if (typeof expectedValue === "object" && expectedValue !== null && !Array.isArray(expectedValue) &&
                 typeof actualValue === "object" && actualValue !== null && !Array.isArray(actualValue)) {
        this.compareSchemas(expectedValue, actualValue, newPath);
      } else if (expectedValue !== undefined && actualValue !== undefined) {
        this.comparePrimitives(expectedValue, actualValue, newPath);
      }
    }
  }

  private compareArrays(expectedArray: unknown[], actualArray: unknown[], path: string): void {
    if (expectedArray.length !== actualArray.length) {
      this.addDiff(
        path,
        "warning",
        `Array length mismatch. Expected ${expectedArray.length}, got ${actualArray.length}.`,
        expectedArray.length,
        actualArray.length,
      );
    }

    const expectedItemType = expectedArray.length > 0 ? (typeof (expectedArray[0]) === 'object' && expectedArray[0] !== null ? {} : null) : null;
    const actualItemType = actualArray.length > 0 ? (typeof (actualArray[0]) === 'object' && actualArray[0] !== null ? {} : null) : null;

    if (expectedItemType && expectedItemType !== {} && typeof expectedItemType === 'object') {
      // Assume homogeneous array of objects for deep comparison
      const expectedSchemaItem = expectedItemType as SchemaDefinition;
      const actualSchemaItem = actualItemType as SchemaDefinition;

      if (expectedSchemaItem && actualSchemaItem) {
        this.addDiff(
          `${path}[]`,
          "warning",
          "Array element structure mismatch detected. Comparing first elements as schema.",
          expectedSchemaItem,
          actualSchemaItem,
        );
        this.compareSchemas(expectedSchemaItem, actualSchemaItem, `${path}[]`);
      }
    } else {
      // Simple type comparison for array elements
      for (let i = 0; i < Math.max(expectedArray.length, actualArray.length); i++) {
        const newPath = `${path}[${i}]`;
        const expectedItem = expectedArray[i];
        const actualItem = actualArray[i];

        if (expectedItem !== undefined && actualItem !== undefined) {
          if (typeof expectedItem === 'object' && expectedItem !== null && typeof actualItem === 'object' && actualItem !== null) {
            this.compareSchemas(expectedItem, actualItem, newPath);
          } else {
            this.comparePrimitives(expectedItem, actualItem, newPath);
          }
        } else if (expectedItem !== undefined && actualItem === undefined) {
          this.addDiff(newPath, "warning", "Missing element in actual array.", expectedItem, undefined);
        } else if (expectedItem === undefined && actualItem !== undefined) {
          this.addDiff(newPath, "warning", "Extra element in actual array.", undefined, actualItem);
        }
      }
    }
  }

  private comparePrimitives(expected: unknown, actual: unknown, path: string): void {
    const expectedType = typeof expected;
    const actualType = typeof actual;

    if (expectedType !== actualType) {
      this.addDiff(
        path,
        "error",
        `Type mismatch. Expected ${expectedType}, but got ${actualType}.`,
        expected,
        actual,
      );
    } else if (expectedType === "object" && expected !== null && actual !== null) {
      // This case should ideally be caught by the caller, but as a fallback:
      this.addDiff(
        path,
        "warning",
        "Object comparison should be handled by schema recursion.",
        expected,
        actual,
      );
    } else if (expected !== actual) {
      this.addDiff(
        path,
        "warning",
        `Value mismatch. Expected ${String(expected)}, got ${String(actual)}.`,
        expected,
        actual,
      );
    }
  }
}

export { SchemaDiffingUtility };