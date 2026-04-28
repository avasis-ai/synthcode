import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Schema {
  type: string;
  properties?: Record<string, Schema>;
  required?: string[];
}

export type ConflictResolutionStrategy = "LATEST" | "STRICT" | "MERGE_FIELDS";

export class StructuredToolOutputSchemaMergerV6 {
  mergeSchemas(
    schemas: Schema[],
    strategy: ConflictResolutionStrategy
  ): Schema {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema array cannot be empty.");
    }

    let mergedSchema: Schema = { type: "object" };
    let currentProperties: Record<string, Schema> = {};
    let currentRequired: string[] = [];

    for (const schema of schemas) {
      if (schema.type !== "object" || !schema.properties) {
        throw new Error("All input schemas must be objects with properties.");
      }

      const properties = schema.properties;
      const required = schema.required || [];

      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const newSchema = properties[key];
          const existingSchema = currentProperties[key];

          if (existingSchema) {
            if (strategy === "STRICT") {
              throw new Error(`Conflict detected for field "${key}". Cannot merge with STRICT strategy.`);
            } else if (strategy === "LATEST") {
              // Overwrite with the latest schema
              currentProperties[key] = newSchema;
            } else if (strategy === "MERGE_FIELDS") {
              // Attempt to merge fields (simplified: prefer the more complex/detailed one or merge properties recursively)
              if (existingSchema.properties && newSchema.properties) {
                const mergedProps = { ...existingSchema.properties, ...newSchema.properties };
                currentProperties[key] = {
                  type: "object",
                  properties: mergedProps,
                  required: [...(existingSchema.required || []), ...(newSchema.required || [])]
                };
              } else {
                // Fallback merge if properties aren't both objects
                currentProperties[key] = newSchema;
              }
            }
          } else {
            // No conflict, just add the new property
            currentProperties[key] = newSchema;
          }
        }
      }
      currentRequired = [...new Set([...currentRequired, ...required])];
    }

    mergedSchema = {
      type: "object",
      properties: currentProperties,
      required: currentRequired,
    };

    return mergedSchema;
  }
}