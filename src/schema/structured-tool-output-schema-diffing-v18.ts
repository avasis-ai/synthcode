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

export interface SchemaDiffReport {
  path: string;
  diffType: "added" | "removed" | "changed" | "type_mismatch";
  oldValue: unknown;
  newValue: unknown;
  migrationSuggestion?: {
    from: string;
    to: string;
    suggestion: string;
  };
  description: string;
}

export interface SchemaDiffingService {
  compareSchemas(
    schemaV1: Record<string, unknown>,
    schemaV2: Record<string, unknown>
  ): SchemaDiffReport[];
}

class StructuredToolOutputSchemaDiffingV18 implements SchemaDiffingService {
  compareSchemas(
    schemaV1: Record<string, unknown>,
    schemaV2: Record<string, unknown>
  ): SchemaDiffReport[] {
    const diffs: SchemaDiffReport[] = [];
    this.recursiveDiff(
      schemaV1,
      schemaV2,
      "root",
      diffs
    );
    return diffs;
  }

  private recursiveDiff(
    schemaV1: unknown,
    schemaV2: unknown,
    path: string,
    diffs: SchemaDiffReport[]
  ): void {
    if (typeof schemaV1 !== "object" || schemaV1 === null || typeof schemaV2 !== "object" || schemaV2 === null) {
      if (schemaV1 !== schemaV2) {
        diffs.push(this.createDiff(
          path,
          "changed",
          schemaV1,
          schemaV2,
          "Primitive type change detected."
        ));
      }
      return;
    }

    const keysV1 = Object.keys(schemaV1) as string[];
    const keysV2 = Object.keys(schemaV2) as string[];
    const allKeys = new Set([...keysV1, ...keysV2]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const valV1 = schemaV1[key];
      const valV2 = schemaV2[key];

      if (schemaV1[key] === undefined) {
        if (schemaV2[key] !== undefined) {
          diffs.push(this.createDiff(
            currentPath,
            "added",
            undefined,
            valV2,
            `New field added: ${key}`
          ));
        }
      } else if (schemaV2[key] === undefined) {
        diffs.push(this.createDiff(
          currentPath,
          "removed",
          valV1,
          undefined,
          `Field removed: ${key}`
        ));
      } else {
        if (typeof valV1 === "object" && valV1 !== null && typeof valV2 === "object" && valV2 !== null) {
          if (Array.isArray(valV1) && Array.isArray(valV2)) {
            this.diffArrays(valV1, valV2, currentPath, diffs);
          } else if (!Array.isArray(valV1) && !Array.isArray(valV2)) {
            this.recursiveDiff(
              valV1,
              valV2,
              currentPath,
              diffs
            );
          } else {
            diffs.push(this.createDiff(
              currentPath,
              "changed",
              valV1,
              valV2,
              "Array type changed or vice versa."
            ));
          }
        } else if (valV1 !== valV2) {
          diffs.push(this.createDiff(
            currentPath,
            "changed",
            valV1,
            valV2,
            "Value mismatch."
          ));
        }
      }
    }
  }

  private diffArrays(
    arrayV1: unknown,
    arrayV2: unknown,
    path: string,
    diffs: SchemaDiffReport[]
  ): void {
    if (!Array.isArray(arrayV1) || !Array.isArray(arrayV2)) {
      return;
    }

    const lenV1 = arrayV1.length;
    const lenV2 = arrayV2.length;
    const maxLen = Math.max(lenV1, lenV2);

    for (let i = 0; i < maxLen; i++) {
      const currentPath = `${path}[${i}]`;
      const itemV1 = arrayV1[i];
      const itemV2 = arrayV2[i];

      if (itemV1 === undefined && itemV2 !== undefined) {
        diffs.push(this.createDiff(
          currentPath,
          "added",
          undefined,
          itemV2,
          `Array element added at index ${i}`
        ));
      } else if (itemV1 !== undefined && itemV2 === undefined) {
        diffs.push(this.createDiff(
          currentPath,
          "removed",
          itemV1,
          undefined,
          `Array element removed at index ${i}`
        ));
      } else if (itemV1 !== undefined && itemV2 !== undefined) {
        if (typeof itemV1 === "object" && itemV1 !== null && typeof itemV2 === "object" && itemV2 !== null) {
          this.recursiveDiff(
            itemV1,
            itemV2,
            currentPath,
            diffs
          );
        } else if (itemV1 !== itemV2) {
          diffs.push(this.createDiff(
            currentPath,
            "changed",
            itemV1,
            itemV2,
            `Array element value changed at index ${i}`
          ));
        }
      }
    }
  }

  private createDiff(
    path: string,
    diffType: "added" | "removed" | "changed" | "type_mismatch",
    oldValue: unknown,
    newValue: unknown,
    description: string
  ): SchemaDiffReport {
    let suggestion: {
      from: string;
      to: string;
      suggestion: string;
    } | undefined = undefined;

    if (diffType === "changed") {
      const typeV1 = typeof oldValue;
      const typeV2 = typeof newValue;

      if (typeV1 !== typeV2) {
        if (typeV1 === "string" && typeV2 === "number") {
          suggestion = {
            from: "string",
            to: "number",
            suggestion: "Consider casting the string value to a number (e.g., parseInt or parseFloat)."
          };
        } else if (typeV1 === "number" && typeV2 === "string") {
          suggestion = {
            from: "number",
            to: "string",
            suggestion: "Consider serializing the number to a string (e.g., String(number))."
          };
        }
      }
    }

    return {
      path,
      diffType,
      oldValue,
      newValue,
      migrationSuggestion: suggestion,
      description,
    };
  }
}

export const structuredToolOutputSchemaDiffingService: SchemaDiffingService = new StructuredToolOutputSchemaDiffingV18();