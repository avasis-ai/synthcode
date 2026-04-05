import { SchemaResolver } from "./schema-resolver-interface";

export class ToolOutputSchemaUnionResolverV11 implements SchemaResolver {
    resolve(
        unionSchemas: { schema: any; context: any }[]
    ): any {
        if (!unionSchemas || unionSchemas.length === 0) {
            return null;
        }

        const mergedSchema: Record<string, any> = {};

        for (const { schema: schemaDef } of unionSchemas) {
            if (!schemaDef || typeof schemaDef !== 'object') continue;

            const properties = schemaDef.properties || {};

            for (const [key, value] of Object.entries(properties)) {
                const currentSchema = mergedSchema[key];
                const newSchema = value;

                if (!currentSchema) {
                    mergedSchema[key] = newSchema;
                } else {
                    if (typeof currentSchema === 'object' && currentSchema !== null && typeof newSchema === 'object' && newSchema !== null) {
                        // Advanced conflict resolution logic:
                        // 1. If both are arrays of types, try to merge them (union of types).
                        // 2. If one is an object and the other is a primitive, prefer the object structure if it's more complex.
                        // 3. If types conflict (e.g., one requires string, other requires number),
                        //    we promote to a union type if possible, or default to the most permissive type (e.g., 'any' or object).

                        const currentType = typeof currentSchema;
                        const newType = typeof newSchema;

                        if (currentType === 'object' && newType === 'object') {
                            // Deep merge properties if both are objects
                            const mergedProps: Record<string, any> = { ...currentSchema, ...newSchema.properties };
                            mergedSchema[key] = {
                                type: "object",
                                properties: mergedProps,
                                required: [...(currentSchema.required || []), ...(newSchema.required || [])]
                            };
                        } else if (currentType === 'string' && newType === 'string') {
                            // Simple type conflict, keep existing or union if necessary
                            mergedSchema[key] = { type: "string" };
                        } else {
                            // Type conflict resolution: Promote to a union type representation
                            mergedSchema[key] = {
                                type: "union",
                                items: [currentSchema, newSchema]
                            };
                        }
                    } else {
                        // Simple overwrite or union of primitives (simplification: prefer the last one encountered)
                        mergedSchema[key] = newSchema;
                    }
                }
            }
        }

        return {
            type: "object",
            properties: mergedSchema,
            required: [] // Simplified: In a real scenario, required fields need careful union logic
        };
    }
}