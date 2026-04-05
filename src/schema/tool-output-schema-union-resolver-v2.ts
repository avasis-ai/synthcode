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

export interface SchemaResolver {
  resolveUnion(
    schemas: any[],
    context: {
      user_hint?: string;
      system_hint?: string;
    }
  ): any;
}

export interface ToolOutputSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
}

export type MergeStrategy = "intersection" | "union" | "strict";

export interface ResolverConfig {
  strategy?: MergeStrategy;
}

export class ToolOutputSchemaUnionResolverV2 implements SchemaResolver {
  private config: ResolverConfig;

  constructor(config: ResolverConfig = {}) {
    this.config = config;
  }

  private resolveType(schema1: any, schema2: any, strategy: MergeStrategy): any {
    if (strategy === "intersection") {
      const intersection: Record<string, any> = {};
      const allProps = new Set([...Object.keys(schema1.properties || {}), ...Object.keys(schema2.properties || {})]);

      for (const key of allProps) {
        const prop1 = schema1.properties?.[key];
        const prop2 = schema2.properties?.[key];

        if (prop1 && prop2) {
          // Simple intersection: assume common type or use the most restrictive one
          intersection[key] = {
            type: "object",
            properties: {
              [key]: {
                type: "string", // Simplified for example
              },
            },
          };
        } else if (prop1) {
          intersection[key] = prop1;
        } else if (prop2) {
          intersection[key] = prop2;
        }
      }
      return {
        type: "object",
        properties: intersection,
      };
    } else if (strategy === "union") {
      // Union: Combine all properties, making them optional if they exist in both
      const unionProps: Record<string, any> = {};
      const allProps = new Set([...Object.keys(schema1.properties || {}), ...Object.keys(schema2.properties || {})]);

      for (const key of allProps) {
        const prop1 = schema1.properties?.[key];
        const prop2 = schema2.properties?.[key];

        if (prop1 || prop2) {
          unionProps[key] = {
            oneOf: [prop1, prop2].filter(Boolean),
          };
        }
      }
      return {
        type: "object",
        properties: unionProps,
      };
    } else {
      // Strict: Prefer the first schema if conflict, or throw if incompatible
      return schema1;
    }
  }

  resolveUnion(
    schemas: any[],
    context: {
      user_hint?: string;
      system_hint?: string;
    }
  ): any {
    if (!schemas || schemas.length === 0) {
      throw new Error("Cannot resolve union with no schemas provided.");
    }

    let currentSchema: any = schemas[0];
    let strategy: MergeStrategy = this.config.strategy || "intersection";

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      if (strategy === "intersection") {
        currentSchema = this.resolveType(currentSchema, nextSchema, "intersection");
      } else if (strategy === "union") {
        currentSchema = this.resolveType(currentSchema, nextSchema, "union");
      } else {
        currentSchema = this.resolveType(currentSchema, nextSchema, "strict");
      }
    }

    // Contextual refinement (Placeholder for advanced logic)
    if (context.user_hint || context.system_hint) {
      console.log("Applying context hints for refinement...");
      // In a real implementation, this would adjust required fields or default values
    }

    return currentSchema;
  }
}

export function createSchemaResolver(
  config: ResolverConfig = {}
): SchemaResolver {
  return new ToolOutputSchemaUnionResolverV2(config);
}