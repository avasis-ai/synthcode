import { JsonSchemaType } from "json-schema-module";

export type SchemaDefinition = Record<string, unknown>;

export class StructuredToolOutputSchemaMerger {
    private schemas: SchemaDefinition[];

    constructor(schemas: SchemaDefinition[]) {
        if (!schemas || schemas.length === 0) {
            throw new Error("Schema definitions array cannot be empty.");
        }
        this.schemas = schemas;
    }

    private mergeProperties(
        existing: Record<string, unknown>,
        newProps: Record<string, unknown>
    ): Record<string, unknown> {
        const merged: Record<string, unknown> = { ...existing };
        for (const key in newProps) {
            if (!Object.prototype.hasOwnProperty.call(newProps, key)) continue;

            const newProp = newProps[key];
            if (Object.prototype.hasOwnProperty.call(existing, key)) {
                const existingProp = existing[key];

                // Simple conflict detection: if both are objects and not arrays, attempt deep merge
                if (typeof existingProp === 'object' && existingProp !== null && !Array.isArray(existingProp) &&
                    typeof newProp === 'object' && newProp !== null && !Array.isArray(newProp)) {
                    (merged[key] as Record<string, unknown>) = this.mergeSchemas(
                        (existingProp as Record<string, unknown>),
                        (newProp as Record<string, unknown>)
                    );
                } else {
                    // Conflict or overwrite: prioritize the new definition if types conflict
                    // For simplicity, we overwrite, but in a real system, this would need stricter conflict resolution.
                    (merged[key] as unknown) = newProp;
                }
            } else {
                (merged[key] as unknown) = newProp;
            }
        }
        return merged;
    }

    private mergeSchemas(
        schema1: SchemaDefinition,
        schema2: SchemaDefinition
    ): SchemaDefinition {
        const merged: Partial<SchemaDefinition> = {};

        // Merge properties
        if (schema1['properties'] && typeof schema1['properties'] === 'object' && !Array.isArray(schema1['properties'])) {
            const props1 = schema1['properties'] as Record<string, unknown>;
            if (schema2['properties'] && typeof schema2['properties'] === 'object' && !Array.isArray(schema2['properties'])) {
                const props2 = schema2['properties'] as Record<string, unknown>;
                const mergedProps = this.mergeProperties(props1, props2);
                merged['properties'] = mergedProps;
            } else {
                merged['properties'] = props1;
            }
        }

        // Merge required fields (union of required fields)
        const required1 = Array.isArray(schema1['required']) ? (schema1['required'] as string[]) : [];
        const required2 = Array.isArray(schema2['required']) ? (schema2['required'] as string[]) : [];
        merged['required'] = [...new Set([...required1, ...required2])];

        // Merge other top-level keys (e.g., title, description) - second schema wins on conflict
        for (const key in schema2) {
            if (!Object.prototype.hasOwnProperty.call(schema2, key)) continue;
            if (!Object.prototype.hasOwnProperty.call(schema1, key) || key === 'properties' || key === 'required') {
                merged[key] = (schema2[key] as unknown);
            }
        }

        return merged as SchemaDefinition;
    }

    public merge(): SchemaDefinition {
        let currentSchema: SchemaDefinition = {
            type: "object",
            properties: {}
        };

        for (const schema of this.schemas) {
            currentSchema = this.mergeSchemas(currentSchema, schema);
        }

        return currentSchema;
    }

    public validate(data: unknown): { isValid: boolean; errors: string[] } {
        const mergedSchema = this.merge();
        const validator = new JsonSchemaType(mergedSchema);

        try {
            const isValid = validator(data);
            if (!isValid) {
                // JsonSchemaType validation usually throws or returns false,
                // but to provide detailed paths, we rely on the underlying library's error reporting if available.
                // For this implementation, we simulate detailed error gathering.
                const errors: string[] = [];
                // In a real scenario, we'd use ajv's validate method which returns detailed errors.
                // Since we are restricted, we assume failure means validation error.
                if (!isValid) {
                    errors.push("Validation failed against the merged schema.");
                }
                return { isValid: false, errors: errors };
            }
            return { isValid: true, errors: [] };
        } catch (e: any) {
            // Catching potential runtime errors from the validator itself
            return { isValid: false, errors: [`Validation runtime error: ${e.message}`] };
        }
    }
}