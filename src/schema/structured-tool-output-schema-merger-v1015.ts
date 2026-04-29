import { StructuredSchemaMergerBase } from "./structured-schema-merger-base.js";

export class StructuredToolOutputSchemaMergerV1015 extends StructuredSchemaMergerBase {
    mergeWithSourceWeighting(schemaA: Record<string, any>, schemaB: Record<string, any>, weights: { [key: string]: number }): Record<string, any> {
        const mergedSchema: Record<string, any> = { ...schemaA };

        const allKeys = new Set<string>([
            ...Object.keys(schemaA),
            ...Object.keys(schemaB)
        ]);

        for (const key of allKeys) {
            const valA = schemaA[key];
            const valB = schemaB[key];

            if (valA === undefined && valB === undefined) continue;

            if (valA === undefined) {
                mergedSchema[key] = valB;
                continue;
            }

            if (valB === undefined) {
                continue;
            }

            // Conflict resolution logic with weighting
            const weightA = weights[key] || 1.0;
            const weightB = weights[key] || 1.0;

            if (weightA >= weightB) {
                mergedSchema[key] = valA;
            } else {
                mergedSchema[key] = valB;
            }
        }

        return mergedSchema;
    }
}