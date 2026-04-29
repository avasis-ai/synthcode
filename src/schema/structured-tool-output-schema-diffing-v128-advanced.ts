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
  fieldPath: string;
  diffType: "MISSING" | "EXTRA" | "TYPE_MISMATCH" | "SEMANTIC_MISMATCH";
  message: string;
  suggestedTransformation?: {
    targetType: string;
    description: string;
    transformation: "COERCE" | "PARSE" | "CLEANSE";
  };
};

export interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "any";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  description?: string;
}

export class StructuredToolOutputSchemaDiffer {
  private readonly schemaA: SchemaDefinition;
  private readonly schemaB: SchemaDefinition;

  constructor(schemaA: SchemaDefinition, schemaB: SchemaDefinition) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
  }

  private getTypeName(schema: SchemaDefinition): string {
    if (schema.type === "object") return "object";
    if (schema.type === "array") return "array";
    return schema.type;
  }

  private analyzeSemanticDifference(
    path: string,
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition
  ): SchemaDiffReport | null {
    const typeA = this.getTypeName(schemaA);
    const typeB = this.getTypeName(schemaB);

    if (typeA === "string" && typeB === "number") {
      return {
        fieldPath: path,
        diffType: "TYPE_MISMATCH",
        message: "Schema A expects string, but Schema B suggests number. Coercion might be needed.",
        suggestedTransformation: {
          targetType: "string",
          description: "Number found in B should be represented as a string.",
          transformation: "COERCE",
        },
      };
    }
    if (typeA === "number" && typeB === "string") {
      return {
        fieldPath: path,
        diffType: "TYPE_MISMATCH",
        message: "Schema A expects number, but Schema B suggests string. Parsing might be needed.",
        suggestedTransformation: {
          targetType: "number",
          description: "String found in B should be parsed to a number.",
          transformation: "PARSE",
        },
      };
    }
    if (typeA === "boolean" && typeB === "string") {
      return {
        fieldPath: path,
        diffType: "TYPE_MISMATCH",
        message: "Schema A expects boolean, but Schema B suggests string. Conversion needed.",
        suggestedTransformation: {
          targetType: "boolean",
          description: "String 'true'/'false' found in B should be cast to boolean.",
          transformation: "CLEANSE",
        },
      };
    }

    return null;
  }

  private compareObjectProperties(
    path: string,
    propsA: Record<string, SchemaDefinition>,
    propsB: Record<string, SchemaDefinition>
  ): SchemaDiffReport[] {
    const diffs: SchemaDiffReport[] = [];
    const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const propA = propsA[key];
      const propB = propsB[key];

      if (!propA && propB) {
        diffs.push({
          fieldPath: currentPath,
          diffType: "EXTRA",
          message: `Field '${key}' exists in Schema B but not in Schema A.`,
        });
      } else if (propA && !propB) {
        diffs.push({
          fieldPath: currentPath,
          diffType: "MISSING",
          message: `Field '${key}' exists in Schema A but is missing in Schema B.`,
        });
      } else if (propA && propB) {
        const semanticDiff = this.analyzeSemanticDifference(currentPath, propA, propB);
        if (semanticDiff) {
          diffs.push(semanticDiff);
        }

        if (propA.type === "object" && propB.type === "object") {
          diffs.push(...this.compareObjectProperties(
            currentPath,
            propA.properties || {},
            propB.properties || {}
          ));
        }
      }
    }
    return diffs;
  }

  public diffSchemas(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition
  ): SchemaDiffReport[] {
    const diffs: SchemaDiffReport[] = [];

    if (schemaA.type !== "object" || schemaB.type !== "object") {
      return [{
        fieldPath: "root",
        diffType: "TYPE_MISMATCH",
        message: "Root schemas must be objects for deep comparison.",
      }];
    }

    diffs.push(...this.compareObjectProperties("root", schemaA.properties || {}, schemaB.properties || {}));

    return diffs;
  }
}