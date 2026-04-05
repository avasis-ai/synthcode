import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface SchemaField {
  type: string;
  required?: boolean;
  description?: string;
  schema?: Record<string, any>;
}

interface Schema {
  [key: string]: SchemaField | any;
}

class ToolOutputSchemaUnionResolverV7 {
  private schemas: Schema[] = [];

  constructor(schemas: Schema[]) {
    this.schemas = schemas;
  }

  public resolveUnion(schemas: Schema[]): Schema {
    if (!schemas || schemas.length === 0) {
      return {} as Schema;
    }

    const mergedSchema: Record<string, SchemaField> = {};

    for (const schema of schemas) {
      this.mergeSchema(schema, mergedSchema);
    }

    return mergedSchema;
  }

  private mergeSchema(newSchema: Schema, currentMerged: Record<string, SchemaField>): void {
    for (const key in newSchema) {
      if (Object.prototype.hasOwnProperty.call(newSchema, key)) {
        const newField = newSchema[key] as SchemaField | any;
        const existingField = currentMerged[key] as SchemaField | undefined;

        if (!existingField) {
          currentMerged[key] = newField;
          continue;
        }

        if (typeof newField === 'object' && newField !== null && 'schema' in newField && 'schema' in existingField) {
          const mergedSubSchema = this.mergeSchemas(newField.schema, existingField.schema);
          currentMerged[key] = {
            type: "object",
            schema: mergedSubSchema,
            required: true,
          };
        } else if (typeof newField === 'string' && typeof existingField === 'string') {
          // Simple type conflict resolution (e.g., "string" vs "number")
          // Prefer the stricter/more general type if conflict exists, or keep the first one.
          if (newField !== existingField) {
            currentMerged[key] = "any"; // Simplification for union conflict
          }
        } else {
          // Handle field-level conflicts (e.g., one is optional, the other is not)
          const isRequiredNew = newField.required === false ? undefined : true;
          const isRequiredExisting = existingField.required === false ? undefined : true;

          if (isRequiredNew !== isRequiredExisting) {
            // Conflict: one requires, one doesn't. Assume optional for safety.
            currentMerged[key] = {
              type: "any",
              required: false,
              description: "Conflict resolved: Field presence is ambiguous across schemas.",
            };
          } else {
            currentMerged[key] = newField; // Overwrite or keep existing structure
          }
        }
      }
    }
  }

  private mergeSchemas(schema1: Record<string, any>, schema2: Record<string, any>): Record<string, any> {
    const merged: Record<string, any> = { ...schema1 };

    for (const key in schema2) {
      if (Object.prototype.hasOwnProperty.call(schema2, key)) {
        const value2 = schema2[key];
        const value1 = schema1[key];

        if (typeof value2 === 'object' && value2 !== null && 'properties' in value2 && 'properties' in value1) {
          const mergedProperties = this.mergeSchemas(value2.properties, value1.properties);
          merged[key] = {
            ...value2,
            properties: mergedProperties,
          };
        } else if (typeof value2 === 'string' && typeof value1 === 'string' && value2 !== value1) {
          // Type conflict at property level
          merged[key] = "any";
        } else {
          // Simple overwrite or merge
          merged[key] = value2;
        }
      }
    }
    return merged;
  }
}

export { ToolOutputSchemaUnionResolverV7 };