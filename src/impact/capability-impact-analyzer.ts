import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types";

type NodeId = string;
type DependencyType = "schema" | "tool" | "capability";

export interface DependencyEdge {
    source: NodeId;
    target: NodeId;
    type: DependencyType;
    impactScore: number;
}

export interface Node {
    id: NodeId;
    name: string;
    type: DependencyType;
    description: string;
    schemaVersion: string;
}

export interface CapabilityDependencyGraph {
    nodes: Map<NodeId, Node>;
    edges: DependencyEdge[];
}

export type ConflictType = "SchemaMismatch" | "MissingDependency" | "BreakingChange" | "CompatibilityIssue";

export interface AffectedComponent {
    id: NodeId;
    name: string;
    reason: string;
}

export interface ImpactReport {
    overallSeverity: "Low" | "Medium" | "High" | "Critical";
    affectedComponents: AffectedComponent[];
    conflictsFound: {
        componentId: NodeId;
        conflictType: ConflictType;
        severity: number;
        description: string;
    }[];
    summary: string;
}

export interface DiffReport {
    changedNodeId: NodeId;
    changeDetails: Record<string, unknown>;
    affectedEdges: {
        source: NodeId;
        target: NodeId;
        reason: string;
    }[];
}

export class CapabilityImpactAnalyzer {
    constructor() {}

    analyzeImpact(diffReport: DiffReport, graph: CapabilityDependencyGraph): ImpactReport {
        const conflicts: {
            componentId: NodeId;
            conflictType: ConflictType;
            severity: number;
            description: string;
        }[] = [];
        const affectedComponents: AffectedComponent[] = [];

        const changedNodeId = diffReport.changedNodeId;

        // 1. Check for direct schema/API changes on the changed node
        if (diffReport.changeDetails.schemaVersion && graph.nodes.has(changedNodeId)) {
            const node = graph.nodes.get(changedNodeId)!;
            if (typeof diffReport.changeDetails.schemaVersion === 'string' && diffReport.changeDetails.schemaVersion !== node.schemaVersion) {
                conflicts.push({
                    componentId: changedNodeId,
                    conflictType: "SchemaMismatch",
                    severity: 0.9,
                    description: `Schema version changed from ${node.schemaVersion} to ${diffReport.changeDetails.schemaVersion}. Downstream consumers must update.`
                });
                affectedComponents.push({
                    id: changedNodeId,
                    name: node.name,
                    reason: "Schema version change detected."
                });
            }
        }

        // 2. Traverse edges to find dependents
        for (const edge of graph.edges) {
            let isAffected = false;
            let conflict: {
                conflictType: ConflictType;
                severity: number;
                description: string;
            } | null = null;

            // Check if the changed node is involved in the edge
            if (edge.source === changedNodeId || edge.target === changedNodeId) {
                isAffected = true;

                // Simple logic: If the source changes, the target might break
                if (edge.source === changedNodeId && edge.target !== changedNodeId) {
                    conflict = {
                        conflictType: "BreakingChange",
                        severity: 0.8,
                        description: `Source ${changedNodeId} changed, potentially breaking dependency for ${edge.target}.`
                    };
                }
                // Simple logic: If the target changes, the source might need updating
                else if (edge.target === changedNodeId && edge.source !== changedNodeId) {
                    conflict = {
                        conflictType: "CompatibilityIssue",
                        severity: 0.6,
                        description: `Target ${changedNodeId} changed, requiring review of dependency from ${edge.source}.`
                    };
                }
            }

            if (isAffected && conflict) {
                conflicts.push({
                    componentId: changedNodeId,
                    conflictType: conflict.conflictType,
                    severity: conflict.severity,
                    description: `Dependency edge (${edge.source} -> ${edge.target}) affected. ${conflict.description}`
                });
                // Mark both ends as affected for comprehensive reporting
                if (!affectedComponents.some(c => c.id === edge.source)) {
                    affectedComponents.push({
                        id: edge.source,
                        name: graph.nodes.get(edge.source)?.name || edge.source,
                        reason: "Dependency source changed."
                    });
                }
                if (!affectedComponents.some(c => c.id === edge.target)) {
                    affectedComponents.push({
                        id: edge.target,
                        name: graph.nodes.get(edge.target)?.name || edge.target,
                        reason: "Dependency target changed."
                    });
                }
            }
        }

        // 3. Determine overall severity
        const maxSeverity = conflicts.reduce((max, conflict) => Math.max(max, conflict.severity), 0);
        let overallSeverity: "Low" | "Medium" | "High" | "Critical";

        if (maxSeverity >= 0.9) {
            overallSeverity = "Critical";
        } else if (maxSeverity >= 0.7) {
            overallSeverity = "High";
        } else if (maxSeverity >= 0.4) {
            overallSeverity = "Medium";
        } else {
            overallSeverity = "Low";
        }

        const summary = `Analysis complete. Found ${conflicts.length} potential conflicts. Overall severity: ${overallSeverity}. Review affected components for required updates.`;

        return {
            overallSeverity: overallSeverity,
            affectedComponents: Array.from(new Set(affectedComponents.map(c => c.id))).map(id => {
                const node = graph.nodes.get(id)!;
                return {
                    id: id,
                    name: node.name,
                    reason: `Affected by change in ${diffReport.changedNodeId}.`
                };
            }),
            conflictsFound: conflicts,
            summary: summary
        };
    }
}

export { CapabilityImpactAnalyzer };