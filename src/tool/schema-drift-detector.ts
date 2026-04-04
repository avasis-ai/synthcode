import { ToolInvocationRecord } from "./tool-invocation-record";

export class SchemaDriftDetector {
    private readonly baselineSchema: Record<string, any>;
    private readonly requiredFields: Set<string>;

    constructor(baselineSchema: Record<string, any>) {
        this.baselineSchema = baselineSchema;
        this.requiredFields = new Set(Object.keys(baselineSchema));
    }

    private getFieldType(value: unknown): string {
        if (typeof value === "string") {
            return "string";
        }
        if (typeof value === "number") {
            return "number";
        }
        if (typeof value === "boolean") {
            return "boolean";
        }
        if (Array.isArray(value)) {
            return "array";
        }
        if (typeof value === "object" && value !== null) {
            return "object";
        }
        return "unknown";
    }

    private calculateFieldPresenceDrift(history: ToolInvocationRecord[]): {
        driftScore: number;
        details: Record<string, { missing: number; present: number }>;
    } {
        const fieldStats: Record<string, { missing: number; present: number }> = {};
        const allFields = new Set([...this.requiredFields]);

        for (const field of allFields) {
            fieldStats[field] = { missing: 0, present: 0 };
        }

        for (const record of history) {
            const output = record.tool_output as Record<string, unknown>;
            for (const field of allFields) {
                if (Object.prototype.hasOwnProperty.call(output, field)) {
                    fieldStats[field].present++;
                } else {
                    fieldStats[field].missing++;
                }
            }
        }

        let totalDriftScore = 0;
        for (const field of allFields) {
            const stats = fieldStats[field];
            const totalObservations = history.length;
            // Simple Jaccard-like index for presence: 1 - (min_count / total)
            // A simpler metric: proportion of times it was missing.
            const drift = stats.missing / totalObservations;
            totalDriftScore += drift;
        }

        return {
            driftScore: totalDriftScore / allFields.size, // Average drift per field
            details: fieldStats
        };
    }

    private calculateTypeDistributionDrift(history: ToolInvocationRecord[]): {
        driftScore: number;
        details: Record<string, { expected: string; observed: Record<string, number> }>;
    } {
        const fieldTypeStats: Record<string, { expected: string; observed: Record<string, number> }> = {};
        const totalObservations = history.length;

        for (const field of this.requiredFields) {
            fieldTypeStats[field] = { expected: this.getFieldType(this.baselineSchema[field]), observed: {} };
        }

        for (const record of history) {
            const output = record.tool_output as Record<string, unknown>;
            for (const field of this.requiredFields) {
                if (Object.prototype.hasOwnProperty.call(output, field)) {
                    const observedType = this.getFieldType(output[field]);
                    const stats = fieldTypeStats[field];
                    stats.observed[observedType] = (stats.observed[observedType] || 0) + 1;
                }
            }
        }

        let totalDriftScore = 0;
        for (const field of this.requiredFields) {
            const stats = fieldTypeStats[field];
            let typeMismatchCount = 0;
            let totalTypeObservations = 0;

            for (const type in stats.observed) {
                if (type !== stats.expected) {
                    typeMismatchCount += stats.observed[type];
                    totalTypeObservations += stats.observed[type];
                }
            }
            
            // Drift score: proportion of observations that deviate from the expected type
            const drift = totalTypeObservations / (totalObservations * 2); // Heuristic scaling
            totalDriftScore += drift;
        }

        return {
            driftScore: totalDriftScore / this.requiredFields.size,
            details: fieldTypeStats
        };
    }

    detectDrift(history: ToolInvocationRecord[]): {
        schemaDriftScore: number;
        fieldPresenceDrift: {
            driftScore: number;
            details: Record<string, { missing: number; present: number }>;
        };
        fieldTypeDrift: {
            driftScore: number;
            details: Record<string, { expected: string; observed: Record<string, number> }>;
        };
    } {
        if (history.length < 2) {
            return {
                schemaDriftScore: 0,
                fieldPresenceDrift: { driftScore: 0, details: {} },
                fieldTypeDrift: { driftScore: 0, details: {} }
            };
        }

        const presenceDrift = this.calculateFieldPresenceDrift(history);
        const typeDrift = this.calculateTypeDistributionDrift(history);

        // Combine scores (simple average for demonstration)
        const schemaDriftScore = (presenceDrift.driftScore + typeDrift.driftScore) / 2;

        return {
            schemaDriftScore: schemaDriftScore,
            fieldPresenceDrift: presenceDrift,
            fieldTypeDrift: typeDrift
        };
    }
}