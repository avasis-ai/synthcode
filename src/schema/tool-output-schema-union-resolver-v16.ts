import { z, ZodSchema } from "zod";

type MergeStrategy = "prefer_union" | "prefer_intersection" | "error_on_conflict";

interface SchemaResolver {
    resolve(schemas: ZodSchema<any>[], strategy: MergeStrategy): ZodSchema<any>;
}

export class ToolOutputSchemaUnionResolverV16 implements SchemaResolver {
    resolve(schemas: ZodSchema<any>[], strategy: MergeStrategy): ZodSchema<any> {
        if (schemas.length === 0) {
            return z.object({});
        }

        const mergedSchema = this.mergeSchemas(schemas, strategy);
        return mergedSchema;
    }

    private mergeSchemas(schemas: ZodSchema<any>[], strategy: MergeStrategy): ZodSchema<any> {
        const properties: Map<string, { schemas: ZodSchema<any>[], type: string }> = new Map();

        for (const schema of schemas) {
            const objectSchema = schema._def.shape;
            if (!objectSchema) continue;

            for (const key in objectSchema) {
                const propSchema = objectSchema[key];
                const propType = propSchema.description || "unknown";

                if (!properties.has(key)) {
                    properties.set(key, { schemas: [], type: propType });
                }
                const existing = properties.get(key)!;
                existing.schemas.push(propSchema);
            }
        }

        const finalShape: Record<string, ZodSchema<any>> = {};

        for (const [key, { schemas: propSchemas, type }] of properties.entries()) {
            let resolvedSchema: ZodSchema<any>;

            if (propSchemas.length === 1) {
                resolvedSchema = propSchemas[0];
            } else {
                resolvedSchema = this.resolveSingleProperty(propSchemas, type, strategy);
            }
            finalShape[key] = resolvedSchema;
        }

        return z.object(finalShape);
    }

    private resolveSingleProperty(propSchemas: ZodSchema<any>[], type: string, strategy: MergeStrategy): ZodSchema<any> {
        if (propSchemas.length === 1) {
            return propSchemas[0];
        }

        if (strategy === "prefer_intersection") {
            return this.intersectSchemas(propSchemas);
        }

        if (strategy === "prefer_union") {
            return this.unionSchemas(propSchemas);
        }

        if (strategy === "error_on_conflict") {
            return this.resolveConflictSchema(propSchemas, type);
        }

        // Default to union if strategy is unknown or complex
        return this.unionSchemas(propSchemas);
    }

    private intersectSchemas(schemas: ZodSchema<any>[]): ZodSchema<any> {
        let currentSchema: ZodSchema<any> = z.object({});

        for (const schema of schemas) {
            const shape = schema.shape;
            const newShape: Record<string, ZodSchema<any>> = {};
            for (const key in shape) {
                const propSchema = shape[key];
                newShape[key] = propSchema;
            }
            currentSchema = z.object({ ...(currentSchema.shape as Record<string, ZodSchema<any>>), ...(newShape as Record<string, ZodSchema<any>>) });
        }
        return currentSchema;
    }

    private unionSchemas(schemas: ZodSchema<any>[]): ZodSchema<any> {
        if (schemas.length === 0) return z.any();
        if (schemas.length === 1) return schemas[0];

        const unionSchema = schemas.reduce((acc, schema) => acc.or(schema), z.any());
        return unionSchema;
    }

    private resolveConflictSchema(schemas: ZodSchema<any>[], type: string): ZodSchema<any> {
        const firstSchema = schemas[0];
        let conflictSchema: ZodSchema<any> = z.object({});

        for (const key in firstSchema.shape) {
            const propSchema = firstSchema.shape[key];
            const propSchemasForConflict = propSchema.constructor.name === 'ZodObject' ? propSchema.shape : [propSchema];

            let mergedPropSchema: ZodSchema<any> = propSchema;

            for (let i = 1; i < schemas.length; i++) {
                const nextSchema = schemas[i];
                const nextPropSchema = nextSchema.shape[key] || nextSchema;

                if (this.isConflict(propSchema, nextPropSchema)) {
                    // In a real scenario, this would throw or return a specific error type.
                    // For this implementation, we default to union if conflict is detected.
                    mergedPropSchema = this.unionSchemas([propSchema, nextPropSchema]);
                    break;
                } else {
                    // Simple merge if no conflict detected (e.g., one is optional, the other is not)
                    mergedPropSchema = this.intersectSchemas([propSchema, nextPropSchema]);
                }
            }
            conflictSchema = conflictSchema.extend({ [key]: mergedPropSchema });
        }
        return conflictSchema;
    }

    private isConflict(schema1: ZodSchema<any>, schema2: ZodSchema<any>): boolean {
        // Simplified conflict detection: if types are drastically different (e.g., one is string, one is number)
        const type1 = schema1.zodType.constructor.name;
        const type2 = schema2.zodType.constructor.name;

        if (type1 !== type2 && !['any', 'string', 'number'].includes(type1) && !['any', 'string', 'number'].includes(type2)) {
            return true;
        }
        return false;
    }
}