import { z } from "zod";

type JsonSchema = z.ZodTypeAny;

interface SchemaAggregator {
    aggregate(schemas: JsonSchema[]): { schema: z.ZodTypeAny; conflicts: string[] };
    validate(data: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export class ToolOutputSchemaAggregator implements SchemaAggregator {
    private aggregatedSchema: z.ZodTypeAny;
    private conflicts: string[];

    constructor() {
        this.aggregatedSchema = z.object({});
        this.conflicts = [];
    }

    private mergeProperties(
        existing: Record<string, z.ZodTypeAny>,
        newProps: Record<string, z.ZodTypeAny>,
        path: string[]
    ): { merged: Record<string, z.ZodTypeAny>; conflicts: string[] } {
        let merged: Record<string, z.ZodTypeAny> = { ...existing };
        let currentConflicts: string[] = [];

        for (const key in newProps) {
            if (!Object.prototype.hasOwnProperty.call(newProps, key)) continue;

            const newProp = newProps[key];
            const fullPath = [...path, key];

            if (Object.prototype.hasOwnProperty.call(existing, key)) {
                const existingProp = existing[key];

                // Simple conflict detection: different types or required status
                if (existingProp.z.isObject() && newProp.z.isObject()) {
                    // Attempt deep merge for objects (e.g., properties)
                    const { merged: mergedProps, conflicts: propConflicts } = this.mergeObjectSchemas(
                        existingProp, newProp, fullPath
                    );
                    merged[key] = z.object(mergedProps);
                    currentConflicts.push(...propConflicts);
                } else if (existingProp.z.getSchema().description !== newProp.z.getSchema().description) {
                    // Type conflict or significant difference
                    currentConflicts.push(
                        `Conflict at '${fullPath.join('.')}'`: `Type or definition mismatch. Existing: ${existingProp.z.infer<any>(), New: ${newProp.z.infer<any>()}`
                    );
                    // For simplicity, we prioritize the existing schema on conflict
                    merged[key] = existingProp;
                } else {
                    merged[key] = newProp; // Overwrite or keep if compatible
                }
            } else {
                // No conflict, just add the new property
                merged[key] = newProp;
            }
        }
        return { merged, conflicts: [...currentConflicts, ...this.conflicts] };
    }

    private mergeObjectSchemas(
        existing: z.ZodObject,
        newProps: z.ZodObject,
        path: string[]
    ): { merged: Record<string, z.ZodTypeAny>; conflicts: string[]; merged: Record<string, z.ZodTypeAny> } {
        let mergedProps: Record<string, z.ZodTypeAny> = {};
        let currentConflicts: string[] = [];

        const existingProps = existing.shape;
        const newPropsShape = newProps.shape;

        const allKeys = new Set([...Object.keys(existingProps), ...Object.keys(newPropsShape)]);

        for (const key of allKeys) {
            const fullPath = [...path, key];
            const existingKey = existingProps[key];
            const newKey = newPropsShape[key];

            if (!existingKey && !newKey) continue;

            if (existingKey && newKey) {
                const { merged: mergedProps, conflicts: propConflicts } = this.mergeProperties(
                    existingProps, newPropsShape, path
                );
                mergedProps[key] = mergedProps[key] || newKey; // Re-use logic from mergeProperties
                currentConflicts.push(...propConflicts);
            } else if (existingKey) {
                mergedProps[key] = existingKey;
            } else {
                mergedProps[key] = newKey;
            }
        }

        return { merged: mergedProps, conflicts: currentConflicts };
    }

    aggregate(schemas: z.ZodTypeAny[]): { schema: z.ZodTypeAny; conflicts: string[] } {
        this.conflicts = [];
        this.aggregatedSchema = z.object({});

        for (const schema of schemas) {
            if (!schema.z.isObject()) {
                throw new Error("All input schemas must be Zod objects.");
            }

            const currentProps = this.aggregatedSchema.shape;
            const newProps = schema.shape;

            const { merged: mergedShape, conflicts: newConflicts } = this.mergeProperties(
                currentProps, newProps, []
            );

            this.aggregatedSchema = z.object(mergedShape);
            this.conflicts.push(...newConflicts);
        }

        return { schema: this.aggregatedSchema, conflicts: this.conflicts };
    }

    validate(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
        const result = this.aggregatedSchema.safeParse(data);
        const errors: string[] = [];

        if (!result.success) {
            // Zod errors are complex; we simplify them for the required output format
            const errorDetails = result.error.errors.map(e => {
                const path = e.path.join(".");
                return `Validation failed for '${path}': ${e.message}`;
            });
            errors.push(...errorDetails);
        }

        return {
            isValid: result.success,
            errors: errors,
        };
    }
}