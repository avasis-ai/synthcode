import {
  Schema,
  Property,
  ArraySchema,
  ObjectSchema,
  TypeSchema,
} from "./schema-types";

export class ToolOutputSchemaUnionAggregator {
  constructor() {}

  /**
   * Aggregates an array of input schemas into a single, coherent JSON Schema union.
   * @param schemas An array of JSON Schema objects representing tool outputs.
   * @returns A canonical JSON Schema object representing the union.
   */
  aggregate(schemas: Schema[]): Schema {
    if (!schemas || schemas.length === 0) {
      return { type: "object", properties: {} };
    }

    const mergedSchema = this.deepMergeSchemas(schemas);

    return {
      type: "object",
      properties: mergedSchema.properties || {},
      required: Object.keys(mergedSchema.properties || {}) as Array<string>,
    };
  }

  /**
   * Recursively merges properties from multiple schemas into a single object structure.
   * Conflict resolution strategy:
   * 1. For primitives (string, number, boolean), the union requires the type to be explicitly defined or it defaults to 'oneOf' if types conflict.
   * 2. For objects, it recursively merges properties.
   * 3. For arrays, it merges definitions if they are complex, otherwise, it assumes the union of item schemas.
   * @param schemas The array of schemas to merge.
   * @returns A merged schema object.
   */
  private deepMergeSchemas(schemas: Schema[]): Schema {
    if (schemas.length === 0) {
      return { type: "object", properties: {} };
    }

    let mergedProperties: Record<string, Schema> = {};

    for (const schema of schemas) {
      if (schema.type !== "object" || !schema.properties) {
        continue;
      }

      const currentProperties = schema.properties;
      for (const key in currentProperties) {
        if (Object.prototype.hasOwnProperty.call(currentProperties, key)) {
          const propertySchema = currentProperties[key];
          const existingSchema = mergedProperties[key];

          if (existingSchema) {
            mergedProperties[key] = this.mergeProperty(existingSchema, propertySchema);
          } else {
            mergedProperties[key] = propertySchema;
          }
        }
      }
    }

    return {
      type: "object",
      properties: mergedProperties,
    };
  }

  /**
   * Merges two property schemas for a single field.
   */
  private mergeProperty(schema1: Schema, schema2: Schema): Schema {
    // Simple type conflict resolution: If types are different and not complex, use oneOf.
    const types1 = schema1.type;
    const types2 = schema2.type;

    if (types1 && types2 && types1 !== types2 && !["object", "array"].includes(types1) && !["object", "array"].includes(types2)) {
      return {
        oneOf: [
          { type: types1, ...schema1 },
          { type: types2, ...schema2 },
        ],
      };
    }

    // If both are objects, recurse.
    if (schema1.type === "object" && schema2.type === "object" && schema1.properties && schema2.properties) {
      const mergedProps = this.deepMergeSchemas([
        { type: "object", properties: schema1.properties },
        { type: "object", properties: schema2.properties },
      ]).properties;

      return {
        type: "object",
        properties: mergedProps,
        required: [...(schema1.required || []), ...(schema2.required || [])] as Array<string>,
      };
    }

    // If both are arrays, merge item schemas (simplified union).
    if (schema1.type === "array" && schema2.type === "array" && schema1.items && schema2.items) {
      return {
        type: "array",
        items: this.mergeProperty(schema1.items, schema2.items),
      };
    }

    // Fallback: Prefer the more complex/specific schema, or use oneOf if types conflict.
    if (schema1.type !== schema2.type) {
      return {
        oneOf: [
          { ...schema1, type: schema1.type },
          { ...schema2, type: schema2.type },
        ],
      };
    }

    // If types match, merge properties if they are objects.
    if (schema1.type === "object" && schema1.properties && schema2.properties) {
      const mergedProps = this.deepMergeSchemas([
        { type: "object", properties: schema1.properties },
        { type: "object", properties: schema2.properties },
      ]).properties;

      return {
        type: "object",
        properties: mergedProps,
        required: [...(schema1.required || []), ...(schema2.required || [])] as Array<string>,
      };
    }

    // Default merge for primitives or identical structures
    return {
      oneOf: [
        { ...schema1, type: schema1.type },
        { ...schema2, type: schema2.type },
      ],
    };
  }
}