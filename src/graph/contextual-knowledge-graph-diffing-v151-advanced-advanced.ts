import { GraphState, Node, Edge, Property, ConflictResolutionStrategy, DiffReport } from "./types";

interface ContextualKnowledgeGraphDiffingService {
    diff(currentGraph: GraphState, targetGraph: GraphState, strategy: ConflictResolutionStrategy): ContextualGraphDiffReport;
}

export class ContextualKnowledgeGraphDiffingService implements ContextualKnowledgeGraphDiffingService {
    diff(currentGraph: GraphState, targetGraph: GraphState, strategy: ConflictResolutionStrategy): ContextualGraphDiffReport {
        const nodeDiffs = this.diffNodes(currentGraph.nodes, targetGraph.nodes, strategy);
        const edgeDiffs = this.diffEdges(currentGraph.edges, targetGraph.edges, strategy);

        const report: ContextualGraphDiffReport = {
            structuralChanges: {
                addedNodes: nodeDiffs.addedNodes,
                removedNodes: nodeDiffs.removedNodes,
                updatedNodes: nodeDiffs.updatedNodes,
                addedEdges: edgeDiffs.addedEdges,
                removedEdges: edgeDiffs.removedEdges,
                updatedEdges: edgeDiffs.updatedEdges,
            },
            semanticDrift: this.analyzeSemanticDrift(currentGraph, targetGraph),
            temporalInconsistencies: this.analyzeTemporalInconsistencies(currentGraph, targetGraph),
            conflictsResolved: {
                nodeConflicts: nodeDiffs.conflicts,
                edgeConflicts: edgeDiffs.conflicts,
            }
        };

        return {
            report: report,
            summary: this.generateSummary(report)
        };
    }

    private diffNodes(currentNodes: Map<string, Node>, targetNodes: Map<string, Node>, strategy: ConflictResolutionStrategy): {
        addedNodes: Node[];
        removedNodes: Node[];
        updatedNodes: Node[];
        conflicts: { nodeId: string, conflicts: Property[] }[];
    } {
        const addedNodes: Node[] = [];
        const removedNodes: Node[] = [];
        const updatedNodes: Node[] = [];
        const conflicts: { nodeId: string, conflicts: Property[] }[] = [];

        const currentIds = new Set(currentNodes.keys());
        const targetIds = new Set(targetNodes.keys());

        // Check for additions and updates
        for (const [id, targetNode] of targetNodes.entries()) {
            const currentNode = currentNodes.get(id);
            if (!currentNode) {
                addedNodes.push(targetNode);
                continue;
            }

            const nodeDiffs: Property[] = this.compareProperties(currentNode, targetNode);
            if (nodeDiffs.length > 0) {
                if (nodeDiffs.some(p => p.type === 'conflict')) {
                    conflicts.push({ nodeId: id, conflicts: nodeDiffs.filter(p => p.type === 'conflict') });
                } else {
                    updatedNodes.push(targetNode);
                }
            }
        }

        // Check for deletions
        for (const id of currentIds) {
            if (!targetIds.has(id)) {
                const node = currentNodes.get(id)!;
                removedNodes.push(node);
            }
        }

        return { addedNodes, removedNodes, updatedNodes, conflicts };
    }

    private diffEdges(currentEdges: Map<string, Edge>, targetEdges: Map<string, Edge>, strategy: ConflictResolutionStrategy): {
        addedEdges: Edge[];
        removedEdges: Edge[];
        updatedEdges: Edge[];
        conflicts: { edgeId: string, conflicts: Property[] }[];
    } {
        const addedEdges: Edge[] = [];
        const removedEdges: Edge[] = [];
        const updatedEdges: Edge[] = [];
        const conflicts: { edgeId: string, conflicts: Property[] }[] = [];

        const currentIds = new Set(currentEdges.keys());
        const targetIds = new Set(targetEdges.keys());

        // Check for additions and updates
        for (const [id, targetEdge] of targetEdges.entries()) {
            const currentEdge = currentEdges.get(id);
            if (!currentEdge) {
                addedEdges.push(targetEdge);
                continue;
            }

            const edgeDiffs: Property[] = this.compareProperties(currentEdge, targetEdge);
            if (edgeDiffs.length > 0) {
                if (edgeDiffs.some(p => p.type === 'conflict')) {
                    conflicts.push({ edgeId: id, conflicts: edgeDiffs.filter(p => p.type === 'conflict') });
                } else {
                    updatedEdges.push(targetEdge);
                }
            }
        }

        // Check for deletions
        for (const id of currentIds) {
            if (!targetIds.has(id)) {
                const edge = currentEdges.get(id)!;
                removedEdges.push(edge);
            }
        }

        return { addedEdges, removedEdges, updatedEdges, conflicts };
    }

    private compareProperties(current: any, target: any): Property[] {
        const diffs: Property[] = [];
        const allKeys = new Set([...Object.keys(current), ...Object.keys(target)]);

        for (const key of allKeys) {
            const currentVal = (current as any)[key];
            const targetVal = (target as any)[key];

            if (currentVal === undefined && targetVal === undefined) continue;

            if (currentVal === undefined) {
                diffs.push({ property: key, type: 'added', oldValue: undefined, newValue: targetVal, resolvedValue: targetVal });
            } else if (targetVal === undefined) {
                diffs.push({ property: key, type: 'removed', oldValue: currentVal, newValue: undefined, resolvedValue: undefined });
            } else if (typeof currentVal !== typeof targetVal || JSON.stringify(currentVal) !== JSON.stringify(targetVal)) {
                const conflict = this.resolveConflict(key, currentVal, targetVal, strategy);
                diffs.push({ property: key, type: 'conflict', oldValue: currentVal, newValue: targetVal, resolvedValue: conflict.value });
            } else {
                diffs.push({ property: key, type: 'unchanged', oldValue: currentVal, newValue: targetVal, resolvedValue: currentVal });
            }
        }
        return diffs;
    }

    private resolveConflict(key: string, oldValue: any, newValue: any, strategy: ConflictResolutionStrategy): { value: any, source: 'old' | 'new' } {
        switch (strategy) {
            case ConflictResolutionStrategy.PREFER_LATEST:
                return { value: newValue, source: 'new' };
            case ConflictResolutionStrategy.PREFER_EARLIEST:
                return { value: oldValue, source: 'old' };
            case ConflictResolutionStrategy.MAJORITY_VOTE:
                // Simplified: Assume 'new' is the majority unless proven otherwise
                return { value: newValue, source: 'new' };
            case ConflictResolutionStrategy.CUSTOM_RULE:
                // In a real system, this would invoke a complex rule engine
                return { value: newValue, source: 'new' };
        }
        return { value: newValue, source: 'new' };
    }

    private analyzeSemanticDrift(current: GraphState, target: GraphState): { driftScore: number; details: string[] } {
        let driftScore = 0;
        const details: string[] = [];

        // Simple heuristic: Check for property changes on core entities (e.g., names, types)
        const nodeDiffs = this.diffNodes(current.nodes, target.nodes, ConflictResolutionStrategy.PREFER_LATEST);
        const edgeDiffs = this.diffEdges(current.edges, target.edges, ConflictResolutionStrategy.PREFER_LATEST);

        const coreKeys: string[] = ["name", "type", "label"];

        const checkNodeDrift = (node: Node, diffs: Property[]): void => {
            let nodeDrift = false;
            for (const key of coreKeys) {
                const diff = diffs.find(p => p.property === key && p.type !== 'unchanged');
                if (diff) {
                    details.push(`Semantic drift detected on Node ${node.id}: Property '${key}' changed from ${JSON.stringify(diff.oldValue)} to ${JSON.stringify(diff.newValue)}.`);
                    nodeDrift = true;
                }
            }
            if (nodeDrift) driftScore += 0.3;
        };

        const checkEdgeDrift = (edge: Edge, diffs: Property[]): void => {
            let edgeDrift = false;
            for (const key of coreKeys) {
                const diff = diffs.find(p => p.property === key && p.type !== 'unchanged');
                if (diff) {
                    details.push(`Semantic drift detected on Edge ${edge.id}: Property '${key}' changed from ${JSON.stringify(diff.oldValue)} to ${JSON.stringify(diff.newValue)}.`);
                    edgeDrift = true;
                }
            }
            if (edgeDrift) driftScore += 0.2;
        };

        // Re-run diffing specifically for drift analysis to capture all changes
        const allNodeDiffs: { [key: string]: Property[] } = {};
        for (const [id, node] of target.nodes.entries()) {
            const current = current.nodes.get(id);
            if (current) {
                allNodeDiffs[id] = this.compareProperties(current, node);
            }
        }

        const allEdgeDiffs: { [key: string]: Property[] } = {};
        for (const [id, edge] of target.edges.entries()) {
            const current = current.edges.get(id);
            if (current) {
                allEdgeDiffs[id] = this.compareProperties(current, edge);
            }
        }

        for (const [id, node] of target.nodes.entries()) {
            const diffs = allNodeDiffs[id] || [];
            checkNodeDrift(node, diffs);
        }
        for (const [id, edge] of target.edges.entries()) {
            const diffs = allEdgeDiffs[id] || [];
            checkEdgeDrift(edge, diffs);
        }


        return { driftScore: Math.min(1.0, driftScore), details };
    }

    private analyzeTemporalInconsistencies(current: GraphState, target: GraphState): { inconsistencies: string[] } {
        const inconsistencies: string[] = [];

        // Check for temporal drift on nodes
        for (const [id, targetNode] of target.nodes.entries()) {
            const currentNode = current.nodes.get(id);
            if (currentNode && targetNode.properties.hasOwnProperty('last_updated_timestamp')) {
                const currentTs = currentNode.properties['last_updated_timestamp'] as number;
                const targetTs = targetNode.properties['last_updated_timestamp'] as number;

                if (currentTs && targetTs && Math.abs(currentTs - targetTs) > 1000) { // 1 second threshold
                    inconsistencies.push(`Temporal inconsistency on Node ${id}: Current timestamp (${new Date(currentTs).toISOString()}) differs significantly from Target timestamp (${new Date(targetTs).toISOString()}).`);
                }
            }
        }

        // Check for temporal drift on edges
        for (const [id, targetEdge] of target.edges.entries()) {
            const currentEdge = current.edges.get(id);
            if (currentEdge && targetEdge.properties.hasOwnProperty('valid_from_timestamp')) {
                const currentTs = currentEdge.properties['valid_from_timestamp'] as number;
                const targetTs = targetEdge.properties['valid_from_timestamp'] as number;

                if (currentTs && targetTs && Math.abs(currentTs - targetTs) > 1000) {
                    inconsistencies.push(`Temporal inconsistency on Edge ${id}: Valid From timestamp differs significantly. Current: ${new Date(currentTs).toISOString()}, Target: ${new Date(targetTs).toISOString()}.`);
                }
            }
        }

        return { inconsistencies };
    }

    private generateSummary(report: ContextualGraphDiffReport): string {
        let summary = "--- Contextual Graph Diff Summary ---\n";
        summary += `Structural Changes:\n`;
        summary += `  Nodes Added: ${report.structuralChanges.addedNodes.length}, Removed: ${report.structuralChanges.removedNodes.length}, Updated: ${report.structuralChanges.updatedNodes.length}\n`;
        summary += `  Edges Added: ${report.structuralChanges.addedEdges.length}, Removed: ${report.structuralChanges.removedEdges.length}, Updated: ${report.structuralChanges.updatedEdges.length}\n`;

        summary += `\nSemantic Drift Analysis:\n`;
        if (report.semanticDrift.driftScore > 0.5) {
            summary += `  ⚠️ HIGH DRIFT DETECTED (Score: ${report.semanticDrift.driftScore.toFixed(2)}). Review details for core entity changes.\n`;
        } else if (report.semanticDrift.driftScore > 0) {
            summary += `  🟡 MODERATE DRIFT DETECTED (Score: ${report.semanticDrift.driftScore.toFixed(2)}). Minor semantic changes noted.\n`;
        } else {
            summary += `  ✅ No significant semantic drift detected.\n`;
        }

        summary += `\nTemporal Inconsistencies:\n`;
        if (report.temporalInconsistencies.inconsistencies.length > 0) {
            summary += `  🚨 ${report.temporalInconsistencies.inconsistencies.length} temporal inconsistency/ies found. Manual review required.\n`;
        } else {
            summary += `  ✅ No temporal inconsistencies found.\n`;
        }

        summary += `\nConflict Resolution:\n`;
        if (report.conflictsResolved.nodeConflicts.length > 0 || report.conflictsResolved.edgeConflicts.length > 0) {
            summary += `  ❗ ${report.conflictsResolved.nodeConflicts.length} node conflict/s and ${report.conflictsResolved.edgeConflicts.length} edge conflict/s were resolved using the '${this.strategyName}' strategy.\n`;
        } else {
            summary += `  ✅ No explicit conflicts requiring resolution were found.\n`;
        }

        return summary;
    }

    private strategyName: string;

    constructor(strategy: ConflictResolutionStrategy) {
        this.strategyName = strategy.toString().replace('ConflictResolutionStrategy.', '').toLowerCase();
    }
}