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

type MergeStrategy = "prefer-latest" | "prefer-earliest" | "deep-merge-optional";

interface SchemaMergeOptions {
  strategy: MergeStrategy;
}

interface ToolOutputSchema {
  type: "object";
  properties: Record<string, SchemaDefinition>;
  required?: string[];
}

interface SchemaDefinition {
  type: "object" | "string" | "array" | "boolean" | "number" | "any";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  enum?: string[];
}

type ToolOutputSchemaUnion = {
  schemas: ToolOutputSchema[];
  options: SchemaMergeOptions;
};

export class ToolOutputSchemaUnionAggregatorV4 {
  private readonly options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions) {
    this.options = options;
  }

  private mergeProperties(
    props1: Record<string, SchemaDefinition>,
    props2: Record<string, SchemaDefinition>,
    strategy: MergeStrategy
  ): Record<string, SchemaDefinition> {
    const merged: Record<string, SchemaDefinition> = { ...props1 };

    for (const key in props2) {
      if (!merged[key]) {
        merged[key] = props2[key];
        continue;
      }

      const def1 = merged[key];
      const def2 = props2[key];

      if (strategy === "deep-merge-optional") {
        if (def1.type === "object" && def2.type === "object") {
          const mergedProps = this.mergeProperties(
            def1.properties || {},
            def2.properties || {},
            strategy
          );
          merged[key] = {
            type: "object";
            properties: mergedProps;
            required: [...(def1.required || []), ...(def2.required || [])]
          };
        } else if (strategy === "prefer-latest") {
          merged[key] = def2;
        } else if (strategy === "prefer-earliest") {
          // Keep def1, do nothing
        } else {
          // Fallback for non-object types or unhandled cases
          merged[key] = def2;
        }
      } else if (strategy === "prefer-latest") {
        merged[key] = def2;
      } else if (strategy === "prefer-earliest") {
        // Keep def1, do nothing
      }
    }
    return merged;
  }

  private mergeSchemas(
    schemas: ToolOutputSchema[],
    strategy: MergeStrategy
  ): ToolOutputSchema {
    if (schemas.length === 0) {
      throw new Error("Cannot merge an empty list of schemas.");
    }

    let currentMerged: ToolOutputSchema = {
      type: "object";
      properties: {} as Record<string, SchemaDefinition>;
    };

    for (const schema of schemas) {
      if (schema.type !== "object") {
        throw new Error("All input schemas must be of type 'object'.");
      }

      const newProperties = this.mergeProperties(
        currentMerged.properties,
        schema.properties || {},
        strategy
      );

      currentMerged = {
        type: "object";
        properties: newProperties,
        required: [...(currentMerged.required || []), ...(schema.required || [])]
      };
    }

    return currentMerged;
  }

  aggregate(toolOutputUnion: ToolOutputSchemaUnion): ToolOutputSchema {
    if (!toolOutputUnion.schemas || toolOutputUnion.schemas.length === 0) {
      throw new Error("ToolOutputSchemaUnion must contain at least one schema.");
    }

    if (toolOutputUnion.options.strategy !== this.options.strategy) {
      throw new Error("Provided options strategy mismatch.");
    }

    return this.mergeSchemas(
      toolOutputUnion.schemas,
      this.options.strategy
    );
  }
}