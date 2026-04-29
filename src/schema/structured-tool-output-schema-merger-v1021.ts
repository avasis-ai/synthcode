import { BaseSchemaMerger } from "./base-schema-merger";

type SchemaDefinition = Record<string, any>;

type ConflictResolutionPolicy = "prefer-latest" | "union-all" | "prefer-existing";

export class StructuredToolOutputSchemaMergerV1021 extends BaseSchemaMerger {
    mergeSchemas(
        schemas: SchemaDefinition[],
        policy: ConflictResolutionPolicy = "prefer-latest"
    ): SchemaDefinition {
        let mergedSchema: SchemaDefinition = {};

        for (const schema of schemas) {
            for (const key in schema) {
                if (Object.prototype.hasOwnProperty.call(schema, key)) {
                    const currentSchema = schema[key];

                    if (!mergedSchema[key]) {
                        mergedSchema[key] = currentSchema;
                        continue;
                    }

                    const existingSchema = mergedSchema[key];

                    if (typeof existingSchema !== typeof currentSchema) {
                        console.warn(`Type mismatch for key "${key}": existing is ${typeof existingSchema}, new is ${typeof currentSchema}. Overwriting.`);
                        mergedSchema[key] = currentSchema;
                        continue;
                    }

                    if (typeof existingSchema === 'object' && existingSchema !== null && typeof currentSchema === 'object' && currentSchema !== null) {
                        if (Array.isArray(existingSchema) && Array.isArray(currentSchema)) {
                            if (policy === "union-all") {
                                mergedSchema[key] = [...new Set([...existingSchema, ...currentSchema])];
                            } else {
                                mergedSchema[key] = existingSchema; // Default to existing array content
                            }
                        } else if (typeof existingSchema === 'object' && typeof currentSchema === 'object') {
                            if (policy === "union-all") {
                                mergedSchema[key] = { ...existingSchema, ...currentSchema };
                            } else if (policy === "prefer-latest") {
                                mergedSchema[key] = { ...existingSchema, ...currentSchema };
                            } else { // prefer-existing
                                // Keep existing structure, potentially merging nested objects if they are simple
                                mergedSchema[key] = { ...existingSchema, ...currentSchema };
                            }
                        } else {
                            // Primitive type conflict resolution
                            if (policy === "prefer-latest") {
                                mergedSchema[key] = currentSchema;
                            } else if (policy === "prefer-existing") {
                                // Keep existing value
                            } else { // union-all for primitives is ambiguous, default to latest
                                mergedSchema[key] = currentSchema;
                            }
                        }
                    } else {
                        // Primitive type conflict resolution
                        if (policy === "prefer-latest") {
                            mergedSchema[key] = currentSchema;
                        } else if (policy === "prefer-existing") {
                            // Keep existing value
                        } else {
                            mergedSchema[key] = currentSchema;
                        }
                    }
                }
            }
        }

        return mergedSchema;
    }
}