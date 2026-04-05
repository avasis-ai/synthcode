import { SchemaResolver } from "./schema-resolver-interface";

export class ToolOutputSchemaUnionResolverV5 implements SchemaResolver {
  resolve(schemas: any[]): any {
    if (!schemas || schemas.length === 0) {
      return {};
    }

    const mergedSchema: Record<string, any> = {};

    for (const schema of schemas) {
      if (!schema || typeof schema !== 'object') continue;

      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
          const currentSchemaType = schema[key];

          if (mergedSchema[key] === undefined) {
            mergedSchema[key] = currentSchemaType;
          } else {
            const existingSchemaType = mergedSchema[key];

            // Simple union logic: If both are objects/arrays, attempt to merge/promote.
            // For this advanced version, we assume promotion to the most general type
            // or merging properties if they are objects.

            if (typeof existingSchemaType === 'object' && existingSchemaType !== null &&
                typeof currentSchemaType === 'object' && currentSchemaType !== null) {
              
              // Advanced Union Logic Simulation:
              // If both define properties, merge them, prioritizing non-null/undefined values.
              if (Array.isArray(existingSchemaType) && Array.isArray(currentSchemaType)) {
                mergedSchema[key] = [...existingSchemaType, ...currentSchemaType];
              } else if (typeof existingSchemaType === 'object' && typeof currentSchemaType === 'object') {
                const mergedObject: Record<string, any> = { ...existingSchemaType, ...currentSchemaType };
                
                // Handle potential type promotion for nested structures if necessary,
                // but for simplicity here, we merge properties.
                mergedSchema[key] = mergedObject;
              } else {
                // Fallback for incompatible types, take the union of definitions (e.g., union type representation)
                mergedSchema[key] = {
                  oneOf: [existingSchemaType, currentSchemaType]
                };
              }
            } else if (existingSchemaType !== currentSchemaType) {
              // Type mismatch, promote to a union definition
              mergedSchema[key] = {
                oneOf: [existingSchemaType, currentSchemaType]
              };
            } else {
              // Types match, keep the existing one
              mergedSchema[key] = existingSchemaType;
            }
          }
        }
      }
    }

    return mergedSchema;
  }
}