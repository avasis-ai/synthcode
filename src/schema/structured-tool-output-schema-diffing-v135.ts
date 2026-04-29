import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Severity = "INFO" | "WARNING" | "ERROR";

interface DiffReport {
  path: string;
  severity: Severity;
  oldValue: unknown;
  newValue: unknown;
  description: string;
}

interface SchemaDiffingTool {
  diffSchemas(
    oldSchema: Record<string, unknown>,
    newSchema: Record<string, unknown>
  ): DiffReport[];
}

class StructuredToolOutputSchemaDiffer implements SchemaDiffingTool {
  diffSchemas(
    oldSchema: Record<string, unknown>,
    newSchema: Record<string, unknown>
  ): DiffReport[] {
    const diffs: DiffReport[] = [];
    this.recursiveDiff(
      oldSchema,
      newSchema,
      "root",
      diffs
    );
    return diffs;
  }

  private recursiveDiff(
    oldData: unknown,
    newData: unknown,
    path: string,
    diffs: DiffReport[]
  ): void {
    if (typeof oldData !== "object" || oldData === null || typeof newData !== "object" || newData === null) {
      if (oldData !== newData) {
        diffs.push({
          path,
          severity: "ERROR",
          oldValue: oldData,
          newValue: newData,
          description: "Primitive value changed.",
        });
      }
      return;
    }

    const oldObject = oldData as Record<string, unknown>;
    const newObject = newData as Record<string, unknown>;

    const oldKeys = Object.keys(oldObject);
    const newKeys = Object.keys(newObject);

    // Check for changed/removed/added keys
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const oldExists = oldObject.hasOwnProperty(key);
      const newExists = newObject.hasOwnProperty(key);

      if (!oldExists && newExists) {
        diffs.push({
          path: currentPath,
          severity: "INFO",
          oldValue: undefined,
          newValue: newObject[key],
          description: "Field added.",
        });
      } else if (oldExists && !newExists) {
        diffs.push({
          path: currentPath,
          severity: "WARNING",
          oldValue: oldObject[key],
          newValue: undefined,
          description: "Field removed.",
        });
      } else {
        const oldVal = oldObject[key];
        const newVal = newObject[key];

        if (typeof oldVal !== "object" || oldVal === null || typeof newVal !== "object" || newVal === null) {
          if (oldVal !== newVal) {
            diffs.push({
              path: currentPath,
              severity: "WARNING",
              oldValue: oldVal,
              newValue: newVal,
              description: "Primitive value changed.",
            });
          }
        } else {
          this.recursiveDiff(oldVal, newVal, currentPath, diffs);
        }
      }
    }

    // Semantic checks (e.g., Array to Object, Object to Array)
    if (oldObject["type"] && newObject["type"]) {
      const oldType = typeof oldObject["type"] === "string" ? oldObject["type"] : "unknown";
      const newType = typeof newObject["type"] === "string" ? newObject["type"] : "unknown";

      if (oldType !== newType) {
        diffs.push({
          path: path,
          severity: "ERROR",
          oldValue: oldType,
          newValue: newType,
          description: `Schema type changed from ${oldType} to ${newType}.`,
        });
      }
    }
  }
}

export const structuredToolOutputSchemaDiffer = new StructuredToolOutputSchemaDiffer();