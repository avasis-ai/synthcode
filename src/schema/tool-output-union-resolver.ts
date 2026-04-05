import { StructuredSchema } from "./structured-schema";

export class ToolOutputUnionResolver {
  private schemas: any[];

  constructor(schemas: any[]) {
    this.schemas = schemas;
  }

  resolve(inputs: { toolName: string, schema: any }[]): StructuredSchema {
    if (inputs.length === 0) {
      return { type: "object", properties: {} };
    }

    const mergedProperties: Record<string, any> = {};
    const propertyTypes: Record<string, string[]> = {};

    for (const input of inputs) {
      const schema = input.schema;
      if (!schema || typeof schema !== 'object') continue;

      const properties = schema.properties || {};

      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const propSchema = properties[key];

          if (!mergedProperties[key]) {
            mergedProperties[key] = propSchema;
            propertyTypes[key] = [propSchema.type || "any"];
          } else {
            // Union logic: If types conflict, we assume a union or pick the most general type.
            // For simplicity here, we'll merge properties and assume the type is an object union if necessary.
            // A real implementation would need deeper type merging logic.
            const existingSchema = mergedProperties[key];
            const existingType = existingSchema.type || "any";
            const newType = propSchema.type || "any";

            if (existingType !== newType) {
              // Simple union representation for conflicting types
              mergedProperties[key] = {
                ...existingSchema,
                type: `union(${existingType}, ${newType})`,
                description: `Union of ${existingSchema.description || ''} and ${propSchema.description || ''}`
              };
            } else {
              // Types match, just ensure properties are merged if they are objects
              if (existingSchema.properties && propSchema.properties) {
                const mergedProps = { ...existingSchema.properties, ...propSchema.properties };
                mergedProperties[key] = {
                  ...existingSchema,
                  properties: mergedProps
                };
              } else {
                mergedProperties[key] = {
                  ...existingSchema,
                  description: `${(existingSchema.description || '')} | ${propSchema.description || ''}`
                };
              }
            }
            propertyTypes[key].push(newType);
          }
        }
      }
    }

    return {
      type: "object",
      properties: mergedProperties,
      description: "Merged output schema from multiple contributing tools.",
    };
  }
}