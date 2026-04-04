import {
  Schema,
  JsonSchemaType,
  JsonSchemaObject,
} from "ajv";

export type ToolOutputSchemaUnion = JsonSchemaObject;

interface SchemaMerger {
  mergeSchemas(schemas: JsonSchemaObject[]): ToolOutputSchemaUnion;
}

const defaultSchema: JsonSchemaObject = {
  type: "object",
  properties: {} as Record<string, JsonSchemaObject>,
  required: [] as string[],
};

const resolveTypeConflict = (
  types: JsonSchemaObject[]
): JsonSchemaObject | undefined => {
  const uniqueTypes = new Set<string>();
  for (const schema of types) {
    if (schema.type) {
      uniqueTypes.add(schema.type);
    }
  }

  if (uniqueTypes.size === 1) {
    const type = Array.from(uniqueTypes)[0] as string;
    return { type: type as JsonSchemaType };
  }

  if (uniqueTypes.size > 1) {
    return {
      oneOf: Array.from(uniqueTypes).map(t => ({ type: t })),
    };
  }

  return undefined;
};

const mergeProperties = (
  properties: Record<string, JsonSchemaObject> | undefined,
  schemas: JsonSchemaObject[],
  propertyName: string
): JsonSchemaObject | undefined => {
  if (!properties) return undefined;

  const typeSchemas: JsonSchemaObject[] = [];
  const requiredFields: Set<string> = new Set();
  const allProperties: Record<string, JsonSchemaObject> = {};

  for (const schema of schemas) {
    const propSchema = schema.properties?.[propertyName];
    if (propSchema) {
      typeSchemas.push(propSchema);
      // For simplicity, we assume if any schema requires it, it's required.
      // A more complex implementation would track required status per field.
    }
  }

  if (typeSchemas.length === 0) {
    return undefined;
  }

  // 1. Merge Types (Union/Intersection logic)
  const mergedType = resolveTypeConflict(typeSchemas);

  // 2. Merge Properties (Deep merge for object types)
  const mergedProperties: Record<string, JsonSchemaObject> = {};
  const allKeys = new Set<string>();
  typeSchemas.forEach(schema => {
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => allKeys.add(key));
    }
  });

  for (const key of allKeys) {
    const subSchemas: JsonSchemaObject[] = [];
    for (const schema of schemas) {
      const prop = schema.properties?.[key];
      if (prop) {
        subSchemas.push(prop);
      }
    }
    const mergedSubSchema = mergeProperties(
      undefined,
      subSchemas,
      key
    );
    if (mergedSubSchema) {
      mergedProperties[key] = mergedSubSchema;
    }
  }

  const finalSchema: JsonSchemaObject = {
    type: mergedType ? (mergedType as JsonSchemaObject) : { type: "object" },
    properties: mergedProperties,
    required: [], // Simplified: Requires logic to aggregate required fields
  };

  return finalSchema;
};

export class ToolOutputSchemaUnion implements SchemaMerger {
  mergeSchemas(schemas: JsonSchemaObject[]): ToolOutputSchemaUnion {
    if (!schemas || schemas.length === 0) {
      return defaultSchema;
    }

    const unifiedSchema: JsonSchemaObject = {
      type: "object",
      properties: {} as Record<string, JsonSchemaObject>,
      required: [] as string[],
    };

    // Assuming all input schemas define the same root object structure
    // and we are merging their properties.
    const firstSchema = schemas[0];
    if (!firstSchema.properties) {
      return defaultSchema;
    }

    const allKeys = new Set<string>();
    schemas.forEach(schema => {
      if (schema.properties) {
        Object.keys(schema.properties).forEach(key => allKeys.add(key));
      }
    });

    const mergedProperties: Record<string, JsonSchemaObject> = {};

    for (const key of allKeys) {
      const subSchemas: JsonSchemaObject[] = [];
      for (const schema of schemas) {
        const prop = schema.properties?.[key];
        if (prop) {
          subSchemas.push(prop);
        }
      }
      const mergedPropSchema = mergeProperties(
        undefined,
        subSchemas,
        key
      );
      if (mergedPropSchema) {
        mergedProperties[key] = mergedPropSchema;
      }
    }

    unifiedSchema.properties = mergedProperties;

    return unifiedSchema;
  }
}