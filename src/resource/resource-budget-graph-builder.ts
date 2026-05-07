import { ResourceBudgetNode, ResourceBudgetGraphBuilder, BudgetConflictPredictor } from "./resource-budget-graph-builder.js";

export class ResourceBudgetGraphBuilder {
    private nodes: ResourceBudgetNode[] = [];
    private capacity: Record<string, number> = {};

    constructor(initialCapacity?: Record<string, number>) {
        if (initialCapacity) {
            this.capacity = initialCapacity;
        }
    }

    addNode(node: ResourceBudgetNode): this {
        this.nodes.push(node);
        return this;
    }

    getNodes(): ResourceBudgetNode[] {
        return [...this.nodes];
    }

    getCapacity(): Record<string, number> {
        return this.capacity;
    }
}

export class ResourceBudgetGraphBuilder {
    private nodes: ResourceBudgetNode[] = [];
    private capacity: Record<string, number> = {};

    constructor(initialCapacity?: Record<string, number>) {
        this.capacity = initialCapacity || {};
    }

    addNode(node: ResourceBudgetNode): this {
        this.nodes.push(node);
        return this;
    }

    getNodes(): ResourceBudgetNode[] {
        return [...this.nodes];
    }

    getCapacity(): Record<string, number> {
        return this.capacity;
    }
}

export interface ResourceBudgetNode {
    resourceId: string;
    startTime: number;
    endTime: number;
    requiredAmount: number;
}

export class ResourceBudgetGraphBuilder {
    private nodes: ResourceBudgetNode[] = [];
    private capacity: Record<string, number> = {};

    constructor(initialCapacity?: Record<string, number>) {
        this.capacity = initialCapacity || {};
    }

    addNode(node: ResourceBudgetNode): this {
        this.nodes.push(node);
        return this;
    }

    getNodes(): ResourceBudgetNode[] {
        return [...this.nodes];
    }

    getCapacity(): Record<string, number> {
        return this.capacity;
    }
}

export class BudgetConflictPredictor {
    private nodes: ResourceBudgetNode[];
    private capacity: Record<string, number>;

    constructor(nodes: ResourceBudgetNode[], capacity: Record<string, number>) {
        this.nodes = nodes;
        this.capacity = capacity;
    }

    predictConflicts(): { conflicts: { resourceId: string; time: { start: number; end: number }; usage: number; capacity: number }[]; suggestions: string[] } {
        const conflicts: { resourceId: string; time: { start: number; end: number }; usage: number; capacity: number }[] = [];
        const timeSlots: Map<string, { start: number; end: number; usage: number }> = new Map();

        const sortedNodes = [...this.nodes].sort((a, b) => a.startTime - b.startTime);

        for (const node of sortedNodes) {
            const resourceId = node.resourceId;
            const start = node.startTime;
            const end = node.endTime;
            const amount = node.requiredAmount;

            if (!timeSlots.has(resourceId)) {
                timeSlots.set(resourceId, { start: start, end: end, usage: 0 });
            }

            const slot = timeSlots.get(resourceId)!;

            if (start < slot.end && end > slot.start) {
                // Overlap detected. We need to merge/update the slot usage.
                const newStart = Math.min(start, slot.start);
                const newEnd = Math.max(end, slot.end);
                
                // Simple approach: track usage at discrete points or just track the maximum overlap.
                // For simplicity and adherence to graph traversal concept, we will track the cumulative usage
                // for the entire duration of the overlap, assuming the resource is required for the full duration.
                
                // Since we are modeling cumulative usage, we need a more complex interval tree or sweep line.
                // For this scope, we will simplify: track the maximum required usage at any point in time.
                
                // Let's use a map of time points to usage for accurate conflict detection.
                // Resetting the conflict detection mechanism to use a simpler, time-based map.
            }
        }

        const usageMap: Map<string, Map<number, number>> = new Map();

        for (const node of this.nodes) {
            if (!usageMap.has(node.resourceId)) {
                usageMap.set(node.resourceId, new Map<number, number>());
            }
            const resourceUsage = usageMap.get(node.resourceId)!;

            // Use a simplified sweep line approach: mark start and end points.
            // Key: time point, Value: change in usage (+amount at start, -amount at end)
            const timeChanges = resourceUsage.get(node.startTime) || 0;
            resourceUsage.set(node.startTime, timeChanges + amount);

            const endChanges = resourceUsage.get(node.endTime) || 0;
            resourceUsage.set(node.endTime, endChanges - amount);
        }

        const conflictReport: { resourceId: string; time: { start: number; end: number }; usage: number; capacity: number }[] = [];
        const suggestions: string[] = [];

        for (const [resourceId, timeChanges] of usageMap.entries()) {
            const sortedTimePoints = Array.from(timeChanges.keys()).sort((a, b) => a - b);
            let currentUsage = 0;
            let conflictStart: number | null = null;

            for (let i = 0; i < sortedTimePoints.length - 1; i++) {
                const t1 = sortedTimePoints[i];
                const t2 = sortedTimePoints[i + 1];

                // Update usage at t1
                currentUsage += timeChanges.get(t1)!;

                if (currentUsage > this.capacity[resourceId]!) {
                    if (conflictStart === null) {
                        conflictStart = t1;
                    }
                } else {
                    if (conflictStart !== null) {
                        // Conflict ended at t1 (or just before t2)
                        conflictReport.push({
                            resourceId: resourceId,
                            time: { start: conflictStart, end: t1 },
                            usage: Math.max(0, currentUsage), // Use the usage level that triggered the conflict
                            capacity: this.capacity[resourceId]!
                        });
                        conflictStart = null;
                    }
                }
            }
            
            // Handle conflict spanning until the last recorded time point
            if (conflictStart !== null) {
                 const lastTime = sortedTimePoints[sortedTimePoints.length - 1];
                 conflictReport.push({
                    resourceId: resourceId,
                    time: { start: conflictStart, end: lastTime },
                    usage: Math.max(0, currentUsage),
                    capacity: this.capacity[resourceId]!
                });
            }
        }

        if (conflictReport.length > 0) {
            suggestions.push("Review the identified conflict periods. Consider staggering tasks or increasing resource capacity.");
        } else {
            suggestions.push("Resource usage appears within defined capacity limits.");
        }

        return { conflicts: conflictReport, suggestions: suggestions };
    }
}

export { ResourceBudgetNode, ResourceBudgetGraphBuilder, BudgetConflictPredictor };