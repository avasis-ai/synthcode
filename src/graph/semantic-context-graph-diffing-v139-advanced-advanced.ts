import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface GraphNode {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: string;
  attributes: Record<string, any>;
}

export interface SemanticContextGraph {
  nodes: Set<GraphNode>;
  edges: Set<GraphEdge>;
}

export interface DiffResult {
  deletions: { nodes: GraphNode[]; edges: GraphEdge[] };
  additions: { nodes: GraphNode[]; edges: GraphEdge[] };
  modifications: { nodes: { id: string; old: Record<string, any>; new: Record<string, any> }[]; edges: { id: string; old: Record<string, any>; new: Record<string, any> }[] };
  semanticImpact: {
    score: number;
    summary: string;
    warnings: string[];
  };
}

export class SemanticContextGraphDiffer {
  private graphA: SemanticContextGraph;
  private graphB: SemanticContextGraph;

  constructor(graphA: SemanticContextGraph, graphB: SemanticContextGraph) {
    this.graphA = graphA;
    this.graphB = graphB;
  }

  private findDeletions(nodesA: Set<GraphNode>, nodesB: Set<GraphNode>): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const deletedNodes: GraphNode[] = [];
    const deletedEdges: GraphEdge[] = [];

    const nodeIdsB = new Set<string>();
    for (const node of nodesB) {
      nodeIdsB.add(node.id);
    }

    for (const node of nodesA) {
      if (!nodeIdsB.has(node.id)) {
        deletedNodes.push(node);
      }
    }

    const nodeIdsA = new Set<string>();
    for (const node of nodesA) {
      nodeIdsA.add(node.id);
    }

    for (const edge of this.graphA.edges) {
      if (!nodeIdsA.has(edge.sourceId) || !nodeIdsA.has(edge.targetId)) continue;

      const isSourceDeleted = !nodesB.has(
        Array.from(nodesB).find((n) => n.id === edge.sourceId)
      );
      const isTargetDeleted = !nodesB.has(
        Array.from(nodesB).find((n) => n.id === edge.targetId)
      );

      if (isSourceDeleted || isTargetDeleted) {
        deletedEdges.push(edge);
      }
    }

    return { nodes: deletedNodes, edges: deletedEdges };
  }

  private findAdditions(nodesA: Set<GraphNode>, nodesB: Set<GraphNode>): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const addedNodes: GraphNode[] = [];
    const addedEdges: GraphEdge[] = [];

    const nodeIdsA = new Set<string>();
    for (const node of nodesA) {
      nodeIdsA.add(node.id);
    }

    for (const node of nodesB) {
      if (!nodeIdsA.has(node.id)) {
        addedNodes.push(node);
      }
    }

    for (const edge of this.graphB.edges) {
      const sourceExistsInA = nodesA.has(
        Array.from(nodesA).find((n) => n.id === edge.sourceId)
      );
      const targetExistsInA = nodesA.has(
        Array.from(nodesA).find((n) => n.id === edge.targetId)
      );

      if (!sourceExistsInA || !targetExistsInA) {
        addedEdges.push(edge);
      }
    }

    return { nodes: addedNodes, edges: addedEdges };
  }

  private findModifications(nodesA: Set<GraphNode>, nodesB: Set<GraphNode>): { nodes: { id: string; old: Record<string, any>; new: Record<string, any> }[]; edges: { id: string; old: Record<string, any>; new: Record<string, any> }[] } {
    const modifiedNodes: { id: string; old: Record<string, any>; new: Record<string, any> }[] = [];
    const modifiedEdges: { id: string; old: Record<string, any>; new: Record<string, any> }[] = [];

    const nodesAArray = Array.from(nodesA);
    const nodesBArray = Array.from(nodesB);

    const nodeMapA = new Map<string, GraphNode>();
    nodesAArray.forEach((node) => nodeMapA.set(node.id, node));

    const nodeMapB = new Map<string, GraphNode>();
    nodesBArray.forEach((node) => nodeMapB.set(node.id, node));

    for (const nodeId of nodeMapA.keys()) {
      if (nodeMapB.has(nodeId)) {
        const nodeA = nodeMapA.get(nodeId)!;
        const nodeB = nodeMapB.get(nodeId)!;
        const oldAttrs = nodeA.attributes;
        const newAttrs = nodeB.attributes;

        const hasChanged = JSON.stringify(oldAttrs) !== JSON.stringify(newAttrs);
        if (hasChanged) {
          modifiedNodes.push({
            id: nodeId,
            old: oldAttrs,
            new: newAttrs,
          });
        }
      }
    }

    const edgesAArray = Array.from(this.graphA.edges);
    const edgesBArray = Array.from(this.graphB.edges);

    const edgeMapA = new Map<string, GraphEdge>();
    edgesAArray.forEach((edge) => edgeMapA.set(`${edge.sourceId}-${edge.targetId}-${edge.type}`, edge));

    const edgeMapB = new Map<string, GraphEdge>();
    edgesBArray.forEach((edge) => edgeMapB.set(`${edge.sourceId}-${edge.targetId}-${edge.type}`, edge));

    for (const key of edgeMapA.keys()) {
      if (edgeMapB.has(key)) {
        const edgeA = edgeMapA.get(key)!;
        const edgeB = edgeMapB.get(key)!;
        const oldAttrs = edgeA.attributes;
        const newAttrs = edgeB.attributes;

        const hasChanged = JSON.stringify(oldAttrs) !== JSON.stringify(newAttrs);
        if (hasChanged) {
          modifiedEdges.push({
            id: key,
            old: oldAttrs,
            new: newAttrs,
          });
        }
      }
    }

    return { nodes: modifiedNodes, edges: modifiedEdges };
  }

  private analyzeSemanticImpact(diff: DiffResult): { score: number; summary: string; warnings: string[] } {
    let impactScore = 0;
    const warnings: string[] = [];
    let summary = "Semantic Impact Analysis: ";

    const totalChanges = diff.additions.nodes.length + diff.deletions.nodes.length + diff.modifications.nodes.length;
    const totalEdgesChanged = diff.additions.edges.length + diff.deletions.edges.length + diff.modifications.edges.length;

    impactScore += Math.min(10, Math.ceil(totalChanges * 0.5));
    impactScore += Math.min(10, Math.ceil(totalEdgesChanged * 0.3));

    if (diff.deletions.nodes.length > 0) {
      summary += `High risk due to ${diff.deletions.nodes.length} node deletions. `;
      warnings.push("Potential loss of critical context data.");
    }

    if (diff.additions.nodes.length > 0) {
      summary += `Context expanded with ${diff.additions.nodes.length} new nodes. `;
    }

    if (diff.modifications.nodes.length > 0) {
      summary += `Attributes updated on ${diff.modifications.nodes.length} nodes. `;
    }

    if (diff.semanticImpact.score < 5 && (diff.additions.nodes.length === 0 && diff.deletions.nodes.length === 0 && diff.modifications.nodes.length === 0)) {
      summary += "No significant structural changes detected. Context is stable.";
      impactScore = 10;
    } else if (diff.semanticImpact.score < 5 && (diff.additions.nodes.length > 0 || diff.deletions.nodes.length > 0 || diff.modifications.nodes.length > 0)) {
      summary += "Minor changes detected, but overall structure remains coherent.";
    } else if (diff.semanticImpact.score >= 18) {
      summary += "CRITICAL CONFLICT DETECTED. Review all changes immediately.";
      warnings.push("High probability of logical inconsistency.");
    }

    return {
      score: Math.min(100, impactScore),
      summary: summary.trim(),
      warnings: warnings,
    };
  }

  public diff(graphB: SemanticContextGraph): DiffResult {
    const deletions = this.findDeletions(this.graphA.nodes, graphB.nodes);
    const additions = this.findAdditions(this.graphA.nodes, graphB.nodes);
    const modifications = this.findModifications(this.graphA.nodes, graphB.nodes);

    const rawDiff: DiffResult = {
      deletions: {
        nodes: deletions.nodes,
        edges: deletions.edges,
      },
      additions: {
        nodes: additions.nodes,
        edges: additions.edges,
      },
      modifications: {
        nodes: modifications.nodes,
        edges: modifications.edges,
      },
      semanticImpact: {
        score: 0,
        summary: "",
        warnings: [],
      },
    };

    const finalDiff = this.analyzeSemanticImpact(rawDiff);
    return {
      ...rawDiff,
      semanticImpact: finalDiff,
    };
  }
}