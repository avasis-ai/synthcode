import { type ToolDefinition } from "../types/tool-definition";

export type Conflict = {
    concept: string;
    description: string;
    severity: "error" | "warning";
};

export type Adaptation = {
    concept: string;
    suggested_change: string;
    reason: string;
};

export interface CompatibilityReport {
    is_compatible: boolean;
    conflicts: Conflict[];
    suggested_adaptations: Adaptation[];
    summary: string;
}

export class SemanticCompatibilityResolver {
    constructor() {}

    private analyzeConcept(concept: string, definitions: ToolDefinition[]): { conflicts: Conflict[]; adaptations: Adaptation[] } {
        const conflicts: Conflict[] = [];
        const adaptations: Adaptation[] = [];

        if (concept === "data_format_mismatch") {
            const hasString = definitions.some(d => d.schema.properties["input_data"]?.type === "string");
            const hasArray = definitions.some(d => d.schema.properties["input_data"]?.type === "array");

            if (hasString && hasArray) {
                conflicts.push({
                    concept: "input_data_type",
                    description: "Conflicting expected types for 'input_data': some tools expect string, others expect array.",
                    severity: "error"
                });
                adaptations.push({
                    concept: "input_data_type",
                    suggested_change: "Standardize 'input_data' to use a common JSON structure (e.g., object or array of strings).",
                    reason: "To ensure consistent data handling across all integrated tools."
                });
            }
        }

        if (concept === "capability_overlap") {
            const names = definitions.map(d => d.name);
            if (names.filter(n => n.includes("fetch")).length > 1) {
                conflicts.push({
                    concept: "redundant_capability",
                    description: "Multiple tools implement 'fetch' functionality, leading to potential execution ambiguity.",
                    severity: "warning"
                });
                adaptations.push({
                    concept: "fetch_implementation",
                    suggested_change: "Consolidate 'fetch' logic into a single, primary utility function.",
                    reason: "Reduces complexity and ensures single source of truth for network operations."
                });
            }
        }

        return { conflicts, adaptations };
    }

    resolve(definitions: ToolDefinition[]): CompatibilityReport {
        if (!definitions || definitions.length === 0) {
            return {
                is_compatible: true,
                conflicts: [],
                suggested_adaptations: [],
                summary: "No definitions provided. Compatibility assumed."
            };
        }

        let allConflicts: Conflict[] = [];
        let allAdaptations: Adaptation[] = [];

        // 1. Analyze core concepts (data types, capabilities)
        const conceptChecks = [
            "data_format_mismatch",
            "capability_overlap"
        ];

        for (const concept of conceptChecks) {
            const { conflicts, adaptations } = this.analyzeConcept(concept, definitions);
            allConflicts.push(...conflicts);
            allAdaptations.push(...adaptations);
        }

        // 2. Determine overall compatibility status
        const isCompatible = allConflicts.every(c => c.severity !== "error");

        // 3. Generate summary
        const summary = `Compatibility check complete. ${definitions.length} tools analyzed. Status: ${isCompatible ? "Compatible with minor warnings." : "Incompatible. Critical conflicts found."}`;

        return {
            is_compatible: isCompatible,
            conflicts: allConflicts,
            suggested_adaptations: allAdaptations,
            summary: summary
        };
    }
}

export { SemanticCompatibilityResolver };