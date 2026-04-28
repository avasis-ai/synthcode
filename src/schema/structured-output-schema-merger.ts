import { z, ZodSchema } from "zod";

export class SchemaConflictError extends Error {
    constructor(message: string, public field: string, public schemas: any[]) {
        super(message);
        this.name = "SchemaConflictError";
    }
}

export type ConflictResolutionStrategy = "prefer_latest" | "union_all" | "strict_intersection";

export interface SchemaMergeOptions {
    conflictStrategy: ConflictResolutionStrategy;
    // If true, fields must have compatible types across all schemas to merge.
    strictTypeChecking: boolean;
}

export class StructuredOutputSchemaMerger {
    private readonly options: SchemaMergeOptions;

    constructor(options: SchemaMergeOptions) {
        this.options = options;
    }

    private resolveTypeConflict(
        field: string,
        types: { schema: ZodSchema<any>; type: string }[]
    ): ZodSchema<any> {
        if (types.length === 1) {
            return types[0].schema;
        }

        if (this.options.conflictStrategy === "union_all") {
            return z.object({
                // Simple union representation for demonstration; real implementation might need more complex union logic
                _union: z.union([
                    ...types.map(t => t.schema)
                ])
            });
        }

        if (this.options.conflictStrategy === "strict_intersection") {
            // Intersection is complex for Zod, we'll approximate by requiring all fields to be present
            // and merging them into a single object structure.
            const requiredFields = types.map(t => t.schema.safeParseSchema).filter(Boolean) as ZodSchema<any>[];
            if (requiredFields.length === 0) {
                return z.any();
            }
            return z.object({
                // This is a simplification. A true intersection requires knowing the keys.
                // For this scope, we assume the intersection means all fields must be present.
                _intersection: z.object({
                    // Placeholder for actual intersection logic
                })
            });
        }

        // Default to prefer_latest (which is handled by the main merge loop structure)
        throw new SchemaConflictError(
            `Type conflict detected for field '${field}'. Strategies: ${JSON.stringify(this.options.conflictStrategy)}`,
            field,
            types.map(t => ({ schema: t.schema, type: t.type }))
        );
    }

    public merge(schemas: ZodSchema<any>[]): ZodSchema<any> {
        if (schemas.length === 0) {
            return z.object({});
        }

        const mergedObjectSchema = z.object({});
        const allKeys: Set<string> = new Set<string>();

        // 1. Collect all keys across all schemas
        for (const schema of schemas) {
            const keys = schema.shape.keys();
            keys.forEach(key => allKeys.add(key));
        }

        const finalShape: Record<string, ZodSchema<any>> = {};

        for (const key of allKeys) {
            const fieldSchemas: { schema: ZodSchema<any>; type: string }[] = [];
            let hasSchema = false;

            // 2. Gather all definitions for the current key
            for (const schema of schemas) {
                if (schema.shape.has(key)) {
                    const fieldSchema = schema.shape.get(key)!;
                    fieldSchemas.push({
                        schema: fieldSchema,
                        type: typeof fieldSchema.safeParseSchema
                    });
                    hasSchema = true;
                }
            }

            if (!hasSchema) continue;

            // 3. Resolve conflicts and merge types
            let mergedFieldSchema: ZodSchema<any>;
            try {
                mergedFieldSchema = this.resolveTypeConflict(key, fieldSchemas);
            } catch (e) {
                if (e instanceof SchemaConflictError) {
                    throw e;
                }
                throw new Error(`Failed to merge schema for key ${key}: ${e instanceof Error ? e.message : String(e)}`);
            }

            finalShape[key] = mergedFieldSchema;
        }

        return z.object(finalShape);
    }
}

export { SchemaConflictError, StructuredOutputSchemaMerger };