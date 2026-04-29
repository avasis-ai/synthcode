import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Schema = Record<string, any>;

type MergeStrategy = "union" | "intersection" | "precedence";

interface MergeConfig {
  field: string;
  strategy: MergeStrategy;
}

export class StructuredToolOutputSchemaMerger {
  private readonly mergeConfig: MergeConfig[];

  constructor(mergeConfig: MergeConfig[]) {
    this.mergeConfig = mergeConfig;
  }

  private getStrategy(field: string): MergeStrategy | undefined {
    const config = this.mergeConfig.find((c) => c.field === field);
    return config ? config.strategy : undefined;
  }

  private mergeTypes(
    type1: any,
    type2: any,
    strategy: MergeStrategy
  ): any {
    if (strategy === "precedence") {
      return type1;
    }
    if (strategy === "union") {
      return {
        oneOf: [type1, type2],
      };
    }
    if (strategy === "intersection") {
      return {
        allOf: [type1, type2],
      };
    }
    return {};
  }

  private mergeSchemas(
    schemas: Schema[],
    field: string
  ): Schema {
    if (schemas.length === 0) {
      return {} as Schema;
    }

    const firstSchema = schemas[0];
    const mergedSchema: Record<string, any> = {
      type: "object",
      properties: {} as Record<string, any>,
      required: [] as string[],
    };

    const allKeys = new Set<string>();
    schemas.forEach((schema) => {
      Object.keys(schema).forEach((key) => allKeys.add(key));
    });

    for (const key of allKeys) {
      const fieldSchemas: Schema[] = [];
      schemas.forEach((schema) => {
        if (key in schema && typeof schema[key] === "object" && schema[key] !== null) {
          fieldSchemas.push(schema[key] as Schema);
        }
      });

      if (fieldSchemas.length === 0) continue;

      const strategy = this.getStrategy(key);
      let finalSchema: Schema;

      if (fieldSchemas.length === 1) {
        finalSchema = fieldSchemas[0];
      } else if (strategy) {
        finalSchema = this.mergeTypes(
          fieldSchemas[0],
          fieldSchemas[1],
          strategy
        );
      } else {
        finalSchema = {
          oneOf: fieldSchemas,
        };
      }

      mergedSchema.properties[key] = finalSchema;
      // Simplified required logic for demonstration
      if (fieldSchemas.every(s => s['required']?.includes(key))) {
        mergedSchema.required.push(key);
      }
    }

    return mergedSchema;
  }

  public merge(schemas: Schema[]): Schema {
    if (!schemas || schemas.length === 0) {
      return {
        type: "object",
        properties: {} as Record<string, any>,
        required: [] as string[],
      };
    }

    return this.mergeSchemas(schemas, "");
  }
}