import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type SchemaDiff = {
  path: string;
  type: "added" | "removed" | "modified" | "type_mismatch" | "optionality_change";
  oldSchema?: any;
  newSchema?: any;
  suggestion?: string;
};

export type SchemaDiffReport = {
  diffs: SchemaDiff[];
  summary: string;
  actionableSteps: string[];
};

interface SchemaDefinition {
  type: "object" | "string" | "number" | "boolean" | "array" | "any";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  description?: string;
}

export class SchemaDiffingAdvanced {
  private schemaA: SchemaDefinition;
  private schemaB: SchemaDefinition;

  constructor(schemaA: SchemaDefinition, schemaB: SchemaDefinition) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
  }

  private getType(schema: SchemaDefinition): string {
    if (!schema || !schema.type) return "unknown";
    return schema.type;
  }

  private compareTypes(oldType: string, newType: string): {
    diff: SchemaDiff;
    suggestion: string;
  } {
    if (oldType === newType) {
      return { diff: { path: "N/A", type: "modified", suggestion: "Types match." }, suggestion: "No type change." };
    }

    let suggestion = "";
    if (oldType === "string" && newType === "number") {
      suggestion = "Type changed from string to number. Consider adding coercion logic.";
    } else if (oldType === "number" && newType === "string") {
      suggestion = "Type changed from number to string. Ensure proper serialization.";
    } else if (oldType === "boolean" && newType !== "boolean") {
      suggestion = "Boolean type changed. Review if explicit string/number representation is needed.";
    } else if (oldType === "object" && newType === "string") {
      suggestion = "Object type reduced to string. Data loss risk; consider if string representation is sufficient.";
    } else {
      suggestion = `Type mismatch detected: ${oldType} -> ${newType}. Manual review required.`;
    }

    const diff: SchemaDiff = {
      path: "Root",
      type: "type_mismatch",
      oldSchema: { type: oldType },
      newSchema: { type: newType },
      suggestion: suggestion,
    };
    return { diff, suggestion };
  }

  private compareProperties(
    path: string,
    oldProps: Record<string, SchemaDefinition>,
    newProps: Record<string, SchemaDefinition>,
    oldRequired: string[],
    newRequired: string[],
  ): SchemaDiff[] {
    const diffs: SchemaDiff[] = [];
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const oldProp = oldProps[key];
      const newProp = newProps[key];

      if (!oldProp) {
        diffs.push({
          path: currentPath,
          type: "added",
          newSchema: newProp,
          suggestion: `New field added: ${key}.`,
        });
        continue;
      }

      if (!newProp) {
        diffs.push({
          path: currentPath,
          type: "removed",
          oldSchema: oldProp,
          suggestion: `Field ${key} was removed. Check for downstream dependencies.`,
        });
        continue;
      }

      // Check for modification
      const oldType = this.getType(oldProp);
      const newType = this.getType(newProp);

      if (oldType !== newType) {
        const { diff, suggestion } = this.compareTypes(oldType, newType);
        diffs.push({
          ...diff,
          path: currentPath,
          suggestion: suggestion,
        });
      } else if (oldType === "object") {
        // Deep comparison for objects
        const subDiffs = this.compareObjectProperties(
          currentPath,
          oldProp as SchemaDefinition,
          newProp as SchemaDefinition,
          (oldProp as SchemaDefinition).required || [],
          (newProp as SchemaDefinition).required || [],
        );
        diffs.push(...subDiffs);
      } else {
        // Simple type check passed, no structural change detected at this level
      }
    }

    // Check required field changes
    const addedRequired = newRequired.filter(req => !oldRequired.includes(req));
    const removedRequired = oldRequired.filter(req => !newRequired.includes(req));

    if (addedRequired.length > 0) {
      diffs.push({
        path: `${path}.required`,
        type: "modified",
        suggestion: `The following fields were newly required: ${addedRequired.join(', ')}.`,
      });
    }
    if (removedRequired.length > 0) {
      diffs.push({
        path: `${path}.required`,
        type: "modified",
        suggestion: `The following fields were no longer required: ${removedRequired.join(', ')}.`,
      });
    }

    return diffs;
  }

  private compareObjectProperties(
    path: string,
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    oldRequired: string[],
    newRequired: string[],
  ): SchemaDiff[] {
    const oldProps = oldSchema.properties || {} as Record<string, SchemaDefinition>;
    const newProps = newSchema.properties || {} as Record<string, SchemaDefinition>;

    let diffs: SchemaDiff[] = [];

    // 1. Compare properties
    diffs.push(...this.compareProperties(
      path,
      oldProps,
      newProps,
      oldRequired,
      newRequired,
    ));

    // 2. Compare required fields (This is partially covered above, but ensures completeness)
    // The recursive call handles the required field check at the end.

    return diffs;
  }

  public diffSchemas(): SchemaDiffReport {
    const diffs = [];

    // Initial comparison call
    const initialDiffs = this.compareProperties(
      "root",
      this.schemaA.properties || {} as Record<string, SchemaDefinition>,
      this.schemaB.properties || {} as Record<string, SchemaDefinition>,
      (this.schemaA as any).required || [],
      (this.schemaB as any).required || [],
    );

    diffs.push(...initialDiffs);

    // Generate summary and actionable steps
    const summary = `Schema comparison complete. Found ${diffs.length} potential differences across ${new Set(diffs.map(d => d.path)).size} paths.`;

    const actionableSteps: string[] = [];
    const uniqueSuggestions = new Set<string>();

    for (const diff of diffs) {
      if (diff.suggestion && !uniqueSuggestions.has(diff.suggestion)) {
        actionableSteps.push(`Review: ${diff.suggestion}`);
        uniqueSuggestions.add(diff.suggestion);
      }
    }

    return {
      diffs: diffs,
      summary: summary,
      actionableSteps: actionableSteps,
    };
  }
}