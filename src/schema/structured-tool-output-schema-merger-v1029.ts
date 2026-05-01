import { type Schema, type Field, type MergeStrategy, type ConflictReport } from "./types";

type SchemaMergerResult = {
    mergedSchema: Schema;
    conflicts: ConflictReport;
};

class SchemaMerger {
    private schemas: Schema[];
    private strategy: MergeStrategy;

    constructor(schemas: Schema[], strategy: MergeStrategy) {
        this.schemas = schemas;
        this.strategy = strategy;
    }

    private resolveConflict(
        field: Field,
        conflictingValues: { schema: Schema; field: Field; value: unknown }[]
    ): { resolvedField: Field; conflictReport: { field: string; resolution: string; details: any } } {
        const fieldName = field.name;
        const types = conflictingValues.map(c => c.value);

        if (types.length === 1) {
            return { resolvedField: field, conflictReport: { field: fieldName, resolution: "No conflict detected.", details: null } };
        }

        if (this.strategy === MergeStrategy.UNION_TYPE) {
            const unionTypes = types.join(" | ");
            const resolvedField: Field = {
                name: fieldName,
                type: "union",
                description: `Union of ${types.length} types: ${unionTypes}`,
                properties: {
                    _oneOf: { type: "array", items: { type: "string" } } // Simplified representation for union
                }
            };
            return { resolvedField, conflictReport: { field: fieldName, resolution: "Merged into Union Type.", details: { originalTypes: types } } };
        }

        if (this.strategy === MergeStrategy.PREFER_LATEST) {
            const latest = conflictingValues[conflictingValues.length - 1];
            return { resolvedField: latest.value, conflictReport: { field: fieldName, resolution: "Preferred latest definition.", details: { source: "Last Schema" } } };
        }

        // Default to strict conflict reporting
        const conflictReport: { field: string; resolution: string; details: any } = {
            field: fieldName,
            resolution: "Conflict Detected - Manual Review Required.",
            details: {
                conflictingTypes: types,
                strategiesApplied: [this.strategy]
            }
        };

        // In a real scenario, we'd return a specialized conflict type here.
        // For this implementation, we'll just return the first schema's definition as a placeholder.
        const resolvedField: Field = {
            name: fieldName,
            type: "any",
            description: `Conflict: ${types.join(", ")}`,
            properties: {}
        };

        return { resolvedField, conflictReport };
    }

    public merge(schemas: Schema[]): { mergedSchema: Schema; conflicts: ConflictReport } {
        if (!schemas || schemas.length === 0) {
            return { mergedSchema: { type: "object", properties: {} } as Schema, conflicts: { conflicts: [] } };
        }

        const mergedProperties: Record<string, Field> = {};
        const conflictReport: ConflictReport = { conflicts: [] };

        for (const schema of schemas) {
            if (schema.type !== "object" || !schema.properties) continue;

            for (const [key, field] of Object.entries(schema.properties)) {
                const fieldName = key;
                const existingField = mergedProperties[fieldName];
                const conflictingValues: { schema: Schema; field: Field; value: unknown }[] = [{ schema: schema, field: field, value: field.type }];

                if (existingField) {
                    conflictingValues.push({ schema: schema, field: field, value: existingField.type });
                }

                const { resolvedField, conflictReport: conflictDetail } = this.resolveConflict(
                    field,
                    conflictingValues
                );

                mergedProperties[fieldName] = resolvedField;
                conflictReport.conflicts.push(conflictDetail);
            }
        }

        const mergedSchema: Schema = {
            type: "object",
            properties: mergedProperties,
            description: "Merged structured tool output schema."
        };

        return { mergedSchema, conflicts: conflictReport };
    }
}

export { SchemaMerger };