interface Step {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    resources: Record<string, number>;
    capabilities: string[];
}

interface GraphNode {
    stepId: string;
    step: Step;
}

interface GraphEdge {
    sourceId: string;
    targetId: string;
    type: "dependency" | "conflict";
    conflictDetails?: string;
}

interface ConflictGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    conflictReport: string[];
}

export class ConflictDependencyGraphBuilder {
    private steps: Step[];

    constructor(steps: Step[]) {
        this.steps = steps;
    }

    private checkResourceConflict(stepA: Step, stepB: Step): string | null {
        const resourceKeys = new Set([...Object.keys(stepA.resources), ...Object.keys(stepB.resources)]);
        for (const resource of resourceKeys) {
            const requiredA = stepA.resources[resource] || 0;
            const requiredB = stepB.resources[resource] || 0;
            const totalRequired = requiredA + requiredB;
            // Assuming a fixed capacity check or simply detecting over-allocation if capacity is implicitly 1
            // For simplicity, we check if the sum exceeds a conceptual limit (e.g., 1 unit of capacity)
            // A more robust system would take capacity limits as input.
            if (totalRequired > 1) {
                return `Resource conflict: ${resource} over-allocated. Required: ${totalRequired}.`;
            }
        }
        return null;
    }

    private checkCapabilityConflict(stepA: Step, stepB: Step): string | null {
        const intersection = stepA.capabilities.filter(capA => stepB.capabilities.includes(capA));
        if (intersection.length > 0) {
            return `Capability conflict: Steps share required capabilities: ${intersection.join(', ')}.`;
        }
        return null;
    }

    private checkTemporalConflict(stepA: Step, stepB: Step): string | null {
        // Check for time overlap
        const overlapStart = Math.max(stepA.startTime, stepB.startTime);
        const overlapEnd = Math.min(stepA.endTime, stepB.endTime);

        if (overlapStart < overlapEnd) {
            return `Temporal conflict: Steps overlap between ${overlapStart} and ${overlapEnd}.`;
        }
        return null;
    }

    private findConflicts(stepA: Step, stepB: Step): { conflict: string, type: "conflict" } | null {
        // Check all conflict types
        const resourceConflict = this.checkResourceConflict(stepA, stepB);
        if (resourceConflict) return { conflict: resourceConflict, type: "conflict" };

        const capabilityConflict = this.checkCapabilityConflict(stepA, stepB);
        if (capabilityConflict) return { conflict: capabilityConflict, type: "conflict" };

        const temporalConflict = this.checkTemporalConflict(stepA, stepB);
        if (temporalConflict) return { conflict: temporalConflict, type: "conflict" };

        return null;
    }

    public buildGraph(): ConflictGraph {
        const nodes: GraphNode[] = this.steps.map(step => ({
            stepId: step.id,
            step: step
        }));

        const edges: GraphEdge[] = [];
        const conflictReport: string[] = [];

        // 1. Check all pairs for conflicts and dependencies
        for (let i = 0; i < this.steps.length; i++) {
            const stepA = this.steps[i];
            const nodeA = nodes[i];

            for (let j = i + 1; j < this.steps.length; j++) {
                const stepB = this.steps[j];
                const nodeB = nodes[j];

                // Check for conflicts
                const conflictResult = this.findConflicts(stepA, stepB);
                if (conflictResult) {
                    const edge: GraphEdge = {
                        sourceId: nodeA.stepId,
                        targetId: nodeB.stepId,
                        type: "conflict",
                        conflictDetails: conflictResult.conflict
                    };
                    edges.push(edge);
                    conflictReport.push(`Conflict detected between ${stepA.name} and ${stepB.name}: ${conflictResult.conflict}`);
                }

                // Check for sequential dependency (A must finish before B starts)
                if (stepA.endTime <= stepB.startTime) {
                    const edge: GraphEdge = {
                        sourceId: nodeA.stepId,
                        targetId: nodeB.stepId,
                        type: "dependency"
                    };
                    edges.push(edge);
                }
            }
        }

        return {
            nodes: nodes,
            edges: edges,
            conflictReport: conflictReport
        };
    }
}