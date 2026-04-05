import { Schema, FieldSchema, Type, UnionResolver, ResolverContext } from "./schema-resolver-types";

export class ToolOutputSchemaUnionResolverV15 implements UnionResolver {
    constructor(private schemas: FieldSchema[]) {}

    resolve(
        schemas: FieldSchema[],
        context: ResolverContext
    ): FieldSchema {
        if (!schemas || schemas.length === 0) {
            throw new Error("Cannot resolve union of zero schemas.");
        }

        let mergedSchema: FieldSchema = {
            type: "object",
            properties: {}
        };

        const allProperties = new Set<string>();
        schemas.forEach(schema => {
            if (schema.type === "object" && schema.properties) {
                Object.keys(schema.properties).forEach(key => allProperties.add(key));
            }
        });

        for (const propName of allProperties) {
            const propertySchemas: FieldSchema[] = [];
            for (const schema of schemas) {
                if (schema.type === "object" && schema.properties && schema.properties[propName]) {
                    propertySchemas.push(schema.properties[propName]);
                }
            }

            if (propertySchemas.length === 0) {
                continue;
            }

            const resolvedProperty = this.resolveUnionForProperty(propName, propertySchemas);
            mergedSchema.properties[propName] = resolvedProperty;
        }

        return {
            type: "object",
            properties: mergedSchema.properties
        };
    }

    private resolveUnionForProperty(
        propertyName: string,
        propertySchemas: FieldSchema[]
    ): FieldSchema {
        const conflictingTypes = new Map<string, Set<string>>();

        propertySchemas.forEach(schema => {
            const type = schema.type;
            if (!conflictingTypes.has(type)) {
                conflictingTypes.set(type, new Set<string>());
            }
            if (schema.type === "string") {
                conflictingTypes.get(type)!.add(schema.description || "string");
            } else if (schema.type === "number") {
                conflictingTypes.get(type)!.add(schema.description || "number");
            } else {
                conflictingTypes.get(type)!.add(type);
            }
        });

        // Conflict Resolution Logic: Prioritize 'string' if mixed, otherwise use union if necessary
        const uniqueTypes = Array.from(conflictingTypes.keys());

        if (uniqueTypes.length === 1) {
            const singleType = uniqueTypes[0];
            const firstSchema = propertySchemas.find(s => s.type === singleType);
            if (firstSchema) {
                return { type: singleType, description: firstSchema.description || "" };
            }
        }

        // Handle mixed types: Defaulting to string is a common robust fallback
        if (uniqueTypes.includes("string") && uniqueTypes.includes("number")) {
            return {
                type: "string",
                description: "Mixed types detected (string/number). Defaulting to string for compatibility."
            };
        }

        // Fallback: Create a union type if multiple distinct types are present
        const unionProperties: Record<string, any> = {};
        if (uniqueTypes.length > 1) {
            unionProperties["oneOf"] = propertySchemas.map(s => ({ type: s.type, description: s.description || "" }));
            return {
                type: "object", // Representing the union structure within the object property
                description: "Union of multiple possible types.",
                properties: {
                    __union_resolver__: {
                        type: "union",
                        oneOf: propertySchemas.map(s => ({ type: s.type, description: s.description || "" }))
                    }
                }
            };
        }

        // If all schemas are identical (should be caught above, but as a safety net)
        return propertySchemas[0] || { type: "any", description: "No specific schema found." };
    }
}