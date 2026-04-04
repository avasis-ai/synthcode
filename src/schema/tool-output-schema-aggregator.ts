import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export interface ToolSchemaInput {
  toolName: string;
  schema: Record<string, any>;
}

export class ToolOutputSchemaAggregator {
  private schemas: ToolSchemaInput[];

  constructor(inputs: ToolSchemaInput[]) {
    this.schemas = inputs;
  }

  private mergeSchemas(schema1: Record<string, any>, schema2: Record<string, any>): Record<string, any> {
    const merged: Record<string, any> = { ...schema1 };

    for (const key in schema2) {
      if (!merged[key]) {
        merged[key] = schema2[key];
        continue;
      }

      const val1 = merged[key];
      const val2 = schema2[key];

      if (val1.$ref && val2.$ref) {
        // Simple reference merge, assuming they point to the same definition or we prefer the second one
        merged[key] = val2;
        continue;
      }

      if (val1.type === "object" && val2.type === "object") {
        if ("properties" in val1 && "properties" in val2) {
          const mergedProperties: Record<string, any> = { ...val1.properties };
          for (const propKey in val2.properties) {
            if (!mergedProperties[propKey]) {
              mergedProperties[propKey] = val2.properties[propKey];
            } else {
              // Deep merge properties if they are objects themselves
              mergedProperties[propKey] = this.mergeSchemas(mergedProperties[propKey], val2.properties[propKey]);
            }
          }
          merged[key] = { type: "object", properties: mergedProperties };
        } else {
          // Fallback: prefer union if types conflict but structure is complex
          merged[key] = {
            oneOf: [
              { ...val1 },
              { ...val2 },
            ],
          };
        }
      } else {
        // Conflict resolution: Prefer union of types if they are simple types
        merged[key] = {
          oneOf: [
            { ...val1 },
            { ...val2 },
          ],
        };
      }
    }
    return merged;
  }

  /**
   * Aggregates an array of tool schemas into a single, unified JSON Schema object.
   * @returns The combined JSON Schema.
   */
  public aggregate(): Record<string, any> {
    if (this.schemas.length === 0) {
      return { type: "object", properties: {} };
    }

    let combinedSchema: Record<string, any> = {
      type: "object",
      properties: {},
      required: [],
    };

    for (const input of this.schemas) {
      const toolSchema = input.schema;
      const toolName = input.toolName;

      if (toolName === "system_message") {
        // Special handling or logging for system messages if they contain schema info
        continue;
      }

      const toolProperties = toolSchema.properties || {};
      const requiredProps = toolSchema.required || [];

      for (const key in toolProperties) {
        const currentProp = toolProperties[key];

        if (!combinedSchema.properties[key]) {
          combinedSchema.properties[key] = currentProp;
          combinedSchema.required.push(key);
        } else {
          const existingProp = combinedSchema.properties[key];
          combinedSchema.properties[key] = this.mergeSchemas(existingProp, currentProp);
          // Note: Re-calculating 'required' accurately across merges is complex;
          // for simplicity, we assume if it's required by any, it's required.
          if (!combinedSchema.required.includes(key)) {
            combinedSchema.required.push(key);
          }
        }
      }
    }

    return combinedSchema;
  }

  /**
   * Generates a validation function based on the aggregated schema.
   * NOTE: In a real-world scenario, this would use a library like ajv.
   * This implementation provides a placeholder structure.
   * @returns A function that attempts to validate an object against the schema.
   */
  public createValidator(): (data: Record<string, unknown> | null) => boolean {
    const finalSchema = this.aggregate();

    return (data: Record<string, unknown> | null): boolean => {
      if (data === null || typeof data !== 'object') {
        return false;
      }
      // Placeholder validation logic: Check if all required properties exist and are non-null.
      const required = (finalSchema as any).required || [];
      for (const key of required) {
        if (!(key in data) || data[key] === null) {
          return false;
        }
      }
      // In a real implementation, this would use JSON Schema validation logic.
      return true;
    };
  }
}