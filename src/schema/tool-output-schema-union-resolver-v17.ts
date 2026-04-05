import { SchemaResolverBase } from "./schema-resolver-base";

type Schema = Record<string, any>;

export class ToolOutputSchemaUnionResolverV17 extends SchemaResolverBase {
    constructor() {
        super();
    }

    resolve(schemas: Schema[]): Schema | null {
        if (!schemas || schemas.length === 0) {
            return null;
        }

        let mergedSchema: Schema = {};

        for (const schema of schemas) {
            if (typeof schema !== 'object' || schema === null) {
                continue;
            }
            
            const currentSchema = schema as Schema;
            
            // Simple merge for top-level properties, assuming keys are additive or one takes precedence
            Object.keys(currentSchema).forEach(key => {
                const keySchema = currentSchema[key];
                
                if (typeof keySchema === 'object' && keySchema !== null && 'oneOf' in keySchema) {
                    // Handle 'oneOf' unions recursively
                    const unionSchemas = keySchema['oneOf'] as Schema[];
                    const resolvedUnion = this.resolveUnion(unionSchemas);
                    mergedSchema[key] = resolvedUnion;
                } else if (typeof keySchema === 'object' && keySchema !== null && 'anyOf' in keySchema) {
                    // Handle 'anyOf' unions recursively
                    const unionSchemas = keySchema['anyOf'] as Schema[];
                    const resolvedUnion = this.resolveUnion(unionSchemas);
                    mergedSchema[key] = resolvedUnion;
                } else if (typeof keySchema === 'object' && keySchema !== null && 'allOf' in keySchema) {
                    // Handle 'allOf' compositions recursively
                    const allOfSchemas = keySchema['allOf'] as Schema[];
                    const resolvedAllOf = this.resolveAllOf(allOfSchemas);
                    mergedSchema[key] = resolvedAllOf;
                } else if (typeof keySchema === 'object' && keySchema !== null && 'type' in keySchema) {
                    // Attempt to merge complex types, prioritizing explicit definitions
                    if (mergedSchema[key] && typeof mergedSchema[key] === 'object' && mergedSchema[key] !== null) {
                        // Simple merge for properties if both are objects
                        const existing = mergedSchema[key] as Schema;
                        const newProps = keySchema as Schema;
                        
                        Object.keys(newProps).forEach(propKey => {
                            if (!existing[propKey] || typeof existing[propKey] !== 'object') {
                                existing[propKey] = newProps[propKey];
                            } else {
                                // Recursive merge for properties
                                existing[propKey] = this.mergeSchemas(existing[propKey], newProps[propKey]);
                            }
                        });
                        mergedSchema[key] = existing;
                    } else {
                        mergedSchema[key] = keySchema;
                    }
                } else {
                    // Simple value assignment or fallback
                    mergedSchema[key] = keySchema;
                }
            });
        }

        return mergedSchema;
    }

    private resolveUnion(schemas: Schema[]): Schema {
        if (schemas.length === 0) {
            return { type: "object", properties: {} }; // Default fallback
        }

        // For unions, we generally keep the structure but ensure all components are resolved
        const resolvedComponents: Schema[] = schemas.map(s => this.resolve(s) || s);
        
        // If all components are simple, we might just return the first one or a union wrapper
        if (resolvedComponents.every(s => !('oneOf' in s) && !('anyOf' in s) && !('allOf' in s))) {
            return { oneOf: resolvedComponents };
        }

        return { oneOf: resolvedComponents };
    }

    private resolveAllOf(schemas: Schema[]): Schema {
        let merged: Schema = {};
        for (const schema of schemas) {
            const resolved = this.resolve(schema) || schema;
            Object.keys(resolved).forEach(key => {
                const value = resolved[key];
                if (typeof value === 'object' && value !== null) {
                    if (!merged[key] || typeof merged[key] !== 'object') {
                        merged[key] = {};
                    }
                    // Recursively merge properties within 'allOf' context
                    (merged[key] as Record<string, any>)[key] = this.mergeSchemas(
                        (merged[key] as Record<string, any>)[key], 
                        (value as Record<string, any>)
                    );
                } else {
                    merged[key] = value;
                }
            });
        }
        return merged;
    }

    private mergeSchemas(schema1: Schema, schema2: Schema): Schema {
        const merged: Schema = { ...schema1, ...schema2 };

        Object.keys(schema2).forEach(key => {
            const val2 = schema2[key];
            const val1 = schema1[key];

            if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
                if ('oneOf' in val1 && 'oneOf' in val2) {
                    merged[key] = { oneOf: [...(val1 as any).oneOf, ...(val2 as any).oneOf };
                } else if ('anyOf' in val1 && 'anyOf' in val2) {
                    merged[key] = { anyOf: [...(val1 as any).anyOf, ...(val2 as any).anyOf };
                } else if ('allOf' in val1 && 'allOf' in val2) {
                    merged[key] = { allOf: [...(val1 as any).allOf, ...(val2 as any).allOf ];
                } else if (typeof val1 === 'object' && typeof val2 === 'object' && !('oneOf' in val1) && !('anyOf' in val1) && !('allOf' in val1)) {
                    // Deep merge for properties
                    merged[key] = this.mergeSchemas(val1 as Schema, val2 as Schema);
                } else {
                    // Overwrite or keep the structure if merging is ambiguous
                    merged[key] = val2;
                }
            } else if (typeof val2 !== 'object' && val2 !== null) {
                merged[key] = val2; // Overwrite primitives
            }
        });

        return merged;
    }
}