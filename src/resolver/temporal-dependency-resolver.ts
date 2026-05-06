import { type Message } from "./types";

type ResourceId = string;

export interface ResourceConstraint {
    resourceId: ResourceId;
    requiredCapacity: number;
}

export interface TemporalDependencyEdge {
    source: string;
    target: string;
    requiredTimeWindow: [number, number]; // [min_start_offset_ms, max_end_offset_ms]
    resourceRequirement: ResourceConstraint;
}

export interface DependencyEdge {
    source: string;
    target: string;
}

export interface DependencyGraph {
    nodes: Record<string, { name: string; durationMs: number }>;
    edges: TemporalDependencyEdge[];
}

export interface ExecutionStep {
    nodeId: string;
    startTimeMs: number;
    endTimeMs: number;
    resourcesUsed: Record<ResourceId, number>;
}

export interface ScheduleContext {
    initialTimeMs: number;
    availableResources: Record<ResourceId, number>;
}

export class TemporalConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TemporalConflictError";
    }
}

export class TemporalDependencyResolver {

    private getPredecessors(graph: DependencyGraph, nodeId: string): string[] {
        const predecessors: string[] = [];
        for (const edge of graph.edges) {
            if (edge.target === nodeId) {
                predecessors.push(edge.source);
            }
        }
        return predecessors;
    }

    private calculateEarliestStart(
        graph: DependencyGraph,
        nodeId: string,
        context: ScheduleContext,
        schedule: Record<string, ExecutionStep>
    ): { startTimeMs: number; requiredResources: Record<ResourceId, number> } {
        
        let earliestStart = context.initialTimeMs;
        const requiredResources: Record<ResourceId, number> = {};

        // 1. Check temporal constraints from predecessors
        const predecessors = this.getPredecessors(graph, nodeId);
        for (const predId of predecessors) {
            const predStep = schedule[predId];
            if (!predStep) {
                throw new Error(`Predecessor ${predId} not scheduled.`);
            }

            // Find the edge connecting predId -> nodeId
            const edge = graph.edges.find(e => e.source === predId && e.target === nodeId);
            if (!edge) {
                throw new Error(`Edge not found between ${predId} and ${nodeId}.`);
            }

            // Temporal constraint: Must start within [min_offset, max_offset] of predecessor completion
            const minOffset = edge.requiredTimeWindow[0];
            const maxOffset = edge.requiredTimeWindow[1];

            // Earliest possible start based on predecessor completion
            const requiredStart = predStep.endTimeMs + minOffset;

            // The start time must be >= requiredStart
            if (requiredStart > earliestStart) {
                earliestStart = requiredStart;
            }

            // Check if the required start time violates the maximum window
            if (predStep.endTimeMs + maxOffset < earliestStart) {
                throw new TemporalConflictError(
                    `Cannot schedule ${nodeId}. Required start time (${earliestStart}ms) exceeds max window (${predStep.endTimeMs + maxOffset}ms) from ${predId}.`
                );
            }
        }

        // 2. Check resource availability
        const resourceRequirements = new Map<ResourceId, number>();
        for (const edge of graph.edges) {
            if (edge.target === nodeId) {
                const req = edge.resourceRequirement;
                const currentUsage = resourceRequirements.get(req.resourceId) || 0;
                resourceRequirements.set(req.resourceId, currentUsage + req.requiredCapacity);
            }
        }
        
        // For simplicity, we assume the resource requirement is defined by the last edge checked, 
        // or we must aggregate all unique requirements. We use the requirement from the first edge found.
        const primaryEdge = graph.edges.find(e => e.target === nodeId);
        if (!primaryEdge) {
            throw new Error(`Node ${nodeId} has no incoming edges.`);
        }
        
        const primaryResource = primaryEdge.resourceRequirement;
        const resourceId = primaryResource.resourceId;
        const capacityNeeded = primaryResource.requiredCapacity;

        // Simple resource check: Does the resource exist and have enough capacity?
        if ((context.availableResources[resourceId] || 0) < capacityNeeded) {
            throw new TemporalConflictError(
                `Insufficient resource capacity for ${nodeId}. Needs ${capacityNeeded} of ${resourceId}, but only ${context.availableResources[resourceId] || 0} available.`
            );
        }

        return { startTimeMs: earliestStart, requiredResources: { [resourceId]: capacityNeeded } };
    }

    public resolveSchedule(
        graph: DependencyGraph,
        context: ScheduleContext
    ): ExecutionStep[] {
        
        const schedule: Record<string, ExecutionStep> = {};
        const scheduledNodes = new Set<string>();
        const nodeIds = Object.keys(graph.nodes);
        
        // Simple topological sort approximation: repeatedly find nodes whose predecessors are all scheduled.
        let nodesToSchedule = [...nodeIds];
        const finalSchedule: ExecutionStep[] = [];

        while (nodesToSchedule.length > 0) {
            let scheduledInThisPass = false;
            const nextPassNodes: string[] = [];

            for (const nodeId of nodesToSchedule) {
                const predecessors = this.getPredecessors(graph, nodeId);
                
                // Check if all predecessors are already scheduled
                const allPredecessorsScheduled = predecessors.every(predId => scheduledNodes.has(predId));

                if (allPredecessorsScheduled && !scheduledNodes.has(nodeId)) {
                    
                    // 1. Calculate earliest start time and check constraints
                    const { startTimeMs } = this.calculateEarliestStart(graph, nodeId, context, schedule);
                    
                    // 2. Determine duration and end time
                    const duration = graph.nodes[nodeId].durationMs;
                    const endTimeMs = startTimeMs + duration;

                    // 3. Record the step
                    const step: ExecutionStep = {
                        nodeId: nodeId,
                        startTimeMs: startTimeMs,
                        endTimeMs: endTimeMs,
                        resourcesUsed: { [graph.edges.find(e => e.target === nodeId)!.resourceRequirement.resourceId]: graph.edges.find(e => e.target === nodeId)!.resourceRequirement.requiredCapacity }
                    };
                    
                    schedule[nodeId] = step;
                    scheduledNodes.add(nodeId);
                    finalSchedule.push(step);
                    scheduledInThisPass = true;
                } else {
                    nextPassNodes.push(nodeId);
                }
            }

            if (!scheduledInThisPass && nodesToSchedule.length > 0) {
                // If we couldn't schedule any node, but nodes remain, there's a cycle or unresolvable dependency.
                throw new TemporalConflictError("Could not resolve schedule. Possible cycle or missing dependency.");
            }
            
            nodesToSchedule = nextPassNodes;
        }

        return finalSchedule;
    }
}