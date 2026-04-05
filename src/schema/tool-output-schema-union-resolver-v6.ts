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
  type: "object" | "array" | "string" | "number" | "boolean" | "oneOf" | "anyOf";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  oneOf?: SchemaDefinition[];
  anyOf?: SchemaDefinition[];
}

type SchemaResolver = (
  schema: SchemaDefinition,
  inputs: SchemaDefinition[]
): {
  resolvedSchema: SchemaDefinition;
  warning?: string;
};

export class ToolOutputSchemaUnionResolverV6 implements SchemaResolver {
  resolve(schema: SchemaDefinition, inputs: SchemaDefinition[]): {
    resolvedSchema: SchemaDefinition;
    warning?: string;
  } {
    if (!inputs || inputs.length === 0) {
      return {
        resolvedSchema: schema,
        warning: "No input schemas provided for union resolution.",
      };
    }

    const unionSchema = this.resolveUnion(schema, inputs);

    return {
      resolvedSchema: unionSchema,
      warning: unionSchema.warning,
    };
  }

  private resolveUnion(schema: SchemaDefinition, inputs: SchemaDefinition[]): {
    resolvedSchema: SchemaDefinition;
    warning?: string;
  } {
    let combinedSchema: SchemaDefinition = {
      type: "object",
      properties: {},
    };
    let allWarnings: string[] = [];
    let hasAmbiguity = false;

    // Simple union for object properties
    const mergedProperties: Record<string, SchemaDefinition> = {};
    const allKeys = new Set<string>();
    inputs.forEach((input) => {
      if (input.type === "object" && input.properties) {
        Object.keys(input.properties).forEach((key) => allKeys.add(key));
      }
    });

    allKeys.forEach((key) => {
      const propertySchemas: SchemaDefinition[] = [];
      inputs.forEach((input) => {
        const prop = (input as any).properties?.[key];
        if (prop) {
          propertySchemas.push(prop);
        }
      });

      if (propertySchemas.length > 0) {
        const { resolvedSchema: propSchema, warning: propWarning } = this.resolveUnion(
          { type: "object", properties: { temp: {} } }, // Dummy schema for recursion
          propertySchemas
        );
        mergedProperties[key] = propSchema;
        if (propWarning) {
          allWarnings.push(propWarning);
        }
      }
    });

    combinedSchema.properties = mergedProperties;

    // Handle top-level oneOf/anyOf union fallback
    if (schema.type === "oneOf" || schema.type === "anyOf") {
      const unionOfSchemas: SchemaDefinition[] = [];
      for (const input of inputs) {
        if (input.type === "object" && input.properties) {
          const { resolvedSchema: resolvedInput } = this.resolveUnion(
            { type: "object", properties: {} },
            [{ type: "object", properties: input.properties }]
          );
          unionOfSchemas.push(resolvedInput);
        } else {
          unionOfSchemas.push(input);
        }
      }

      if (unionOfSchemas.length === 1) {
        return { resolvedSchema: unionOfSchemas[0], warning: null };
      }

      const finalUnion: SchemaDefinition = {
        type: "oneOf",
        oneOf: unionOfSchemas.map(s => ({ ...s, type: "object" })), // Assume object for union context
      };

      if (unionOfSchemas.length > 1) {
        hasAmbiguity = true;
        allWarnings.push(
          `Ambiguity detected: Merging ${unionOfSchemas.length} distinct structures into a union.`
        );
      }

      return {
        resolvedSchema: finalUnion,
        warning: allWarnings.length > 0 ? allWarnings.join(" | ") : undefined,
      };
    }

    // Fallback for general object union
    if (Object.keys(mergedProperties).length > 0) {
      return {
        resolvedSchema: {
          type: "object",
          properties: mergedProperties,
          required: [], // Simplification: assuming no required fields can be determined universally
        },
        warning: allWarnings.length > 0 ? allWarnings.join(" | ") : undefined,
      };
    }

    return {
      resolvedSchema: schema,
      warning: allWarnings.length > 0 ? allWarnings.join(" | ") : undefined,
    };
  }
}