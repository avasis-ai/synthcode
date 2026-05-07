import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

interface ComponentDefinition {
    name: string;
    version: string;
    schema: (input: Record<string, unknown>) => boolean;
    resourceRequirements: string;
    sideEffects: string;
}

interface CompatibilityScore {
    score: number;
    isCompatible: boolean;
    conflicts: string[];
}

interface CompatibilityMatrix {
    [key: string]: {
        [key: string]: CompatibilityScore;
    };
}

class CompatibilityMatrixGenerator {
    private components: ComponentDefinition[];

    constructor(components: ComponentDefinition[]) {
        this.components = components;
    }

    private checkSchemaCompatibility(compA: ComponentDefinition, compB: ComponentDefinition): CompatibilityScore {
        // Simple check: Assume compatibility if schemas are structurally similar enough
        // In a real system, this would involve deep schema comparison (e.g., JSON Schema diffing)
        const schemaMatch = compA.schema && compB.schema;
        const score = schemaMatch ? 0.9 : 0.5;
        const isCompatible = score >= 0.7;
        const conflicts = [];

        if (!isCompatible) {
            conflicts.push("Schema mismatch detected.");
        }
        return { score, isCompatible, conflicts };
    }

    private checkResourceConflict(compA: ComponentDefinition, compB: ComponentDefinition): CompatibilityScore {
        // Check for mutually exclusive or conflicting resource needs
        if (compA.resourceRequirements === "GPU_HIGH" && compB.resourceRequirements === "CPU_ONLY") {
            return { score: 0.6, isCompatible: false, conflicts: ["Resource conflict: GPU_HIGH requires dedicated resources incompatible with CPU_ONLY."] };
        }
        if (compA.resourceRequirements === compB.resourceRequirements && compA.resourceRequirements !== "NONE") {
            return { score: 0.8, isCompatible: true, conflicts: [] };
        }
        return { score: 1.0, isCompatible: true, conflicts: [] };
    }

    private checkSideEffectConflict(compA: ComponentDefinition, compB: ComponentDefinition): CompatibilityScore {
        // Check for conflicting side effects (e.g., one modifies state, the other reads it without warning)
        if (compA.sideEffects.includes("WRITE_GLOBAL_STATE") && compB.sideEffects.includes("READ_GLOBAL_STATE")) {
            return { score: 0.7, isCompatible: true, conflicts: ["Potential race condition: Global state write/read interaction detected. Requires explicit synchronization."] };
        }
        if (compA.sideEffects === "IO_WRITE" && compB.sideEffects === "IO_WRITE") {
            return { score: 0.5, isCompatible: false, conflicts: ["Critical conflict: Both components perform direct IO_WRITE. Conflict resolution needed."] };
        }
        return { score: 1.0, isCompatible: true, conflicts: [] };
    }

    public generateMatrix(): CompatibilityMatrix {
        const matrix: CompatibilityMatrix = {};

        for (const compA of this.components) {
            matrix[compA.name] = {};
            for (const compB of this.components) {
                if (compA.name === compB.name && compA.version === compB.version) {
                    matrix[compA.name][compB.name] = { score: 1.0, isCompatible: true, conflicts: [] };
                    continue;
                }

                const schemaScore = this.checkSchemaCompatibility(compA, compB);
                const resourceScore = this.checkResourceConflict(compA, compB);
                const sideEffectScore = this.checkSideEffectConflict(compA, compB);

                const overallScore = (schemaScore.score + resourceScore.score + sideEffectScore.score) / 3;
                const overallConflicts = [
                    ...schemaScore.conflicts,
                    ...resourceScore.conflicts,
                    ...sideEffectScore.conflicts
                ];

                const isCompatible = overallScore >= 0.7 && overallConflicts.length === 0;

                matrix[compA.name][compB.name] = {
                    score: overallScore,
                    isCompatible: isCompatible,
                    conflicts: overallConflicts
                };
            }
        }
        return matrix;
    }
}

export { CompatibilityMatrixGenerator };