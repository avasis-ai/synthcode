import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContentBlock {
  type: "text" | "tool_use" | "thinking";
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; result: string };

interface Node {
  id: string;
  type: string;
  content: any;
  timestamp: number;
}

interface Edge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  weight: number;
  timestamp: number;
}

export interface SemanticGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface ConceptualGap {
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  severity: "missing" | "weakened" | "drifted";
  description: string;
  sourceState: "A" | "B";
  targetState: "A" | "B";
}

export interface GraphDiff {
  addedNodes: Node[];
  removedNodes: Node[];
  modifiedNodes: Node[];
  addedEdges: Edge[];
  removedEdges: Edge[];
  modifiedEdges: Edge[];
  conceptualGaps: ConceptualGap[];
}

export class SemanticContextGraphDiffer {
  private stateA: SemanticGraph;
  private stateB: SemanticGraph;

  constructor(stateA: SemanticGraph, stateB: SemanticGraph) {
    this.stateA = stateA;
    this.stateB = stateB;
  }

  private getNodeMap(graph: SemanticGraph): Map<string, Node> {
    return new Map(graph.nodes.map(node => [node.id, node]));
  }

  private getEdgeMap(graph: SemanticGraph): Map<string, Edge> {
    const edgeMap = new Map<string, Edge>();
    graph.edges.forEach(edge => {
      const key = `${edge.sourceId}-${edge.targetId}-${edge.relationshipType}`;
      edgeMap.set(key, edge);
    });
    return edgeMap;
  }

  private compareNodes(mapA: Map<string, Node>, mapB: Map<string, Node>): {
    added: Node[];
    removed: Node[];
    modified: Node[];
  } {
    const added: Node[] = [];
    const removed: Node[] = [];
    const modified: Node[] = [];

    const idsA = new Set(mapA.keys());
    const idsB = new Set(mapB.keys());

    // Removed/Modified
    idsA.forEach(id => {
      if (!idsB.has(id)) {
        removed.push(mapA.get(id)!);
      } else {
        const nodeA = mapA.get(id)!;
        const nodeB = mapB.get(id)!;
        // Simple content comparison for modification detection
        if (JSON.stringify(nodeA.content) !== JSON.stringify(nodeB.content)) {
          modified.push(nodeB);
        }
      }
    });

    // Added
    idsB.forEach(id => {
      if (!idsA.has(id)) {
        added.push(mapB.get(id)!);
      }
    });

    return { added, removed, modified };
  }

  private compareEdges(mapA: Map<string, Edge>, mapB: Map<string, Edge>): {
    added: Edge[];
    removed: Edge[];
    modified: Edge[];
  } {
    const added: Edge[] = [];
    const removed: Edge[] = [];
    const modified: Edge[] = [];

    const keysA = new Set(mapA.keys());
    const keysB = new Set(mapB.keys());

    // Removed/Modified
    keysA.forEach(key => {
      if (!keysB.has(key)) {
        removed.push(mapA.get(key)!);
      } else {
        const edgeA = mapA.get(key)!;
        const edgeB = mapB.get(key)!;
        // Check for significant weight change or relationship type change (if key structure allowed)
        if (Math.abs(edgeA.weight - edgeB.weight) > 0.5) {
          modified.push(edgeB);
        }
      }
    });

    // Added
    keysB.forEach(key => {
      if (!keysA.has(key)) {
        added.push(mapB.get(key)!);
      }
    });

    return { added, removed, modified };
  }

  private detectConceptualGaps(graphA: SemanticGraph, graphB: SemanticGraph): ConceptualGap[] {
    const gaps: ConceptualGap[] = [];
    const edgesA = graphA.edges;
    const edgesB = graphB.edges;

    const nodeMapA = this.getNodeMap(graphA);
    const nodeMapB = this.getNodeMap(graphB);

    // 1. Check for missing relationships (A -> B but not B)
    for (const edgeA of edgesA) {
      const key = `${edgeA.sourceId}-${edgeA.targetId}-${edgeA.relationshipType}`;
      const edgeB = edgesB.find(e =>
        e.sourceId === edgeA.sourceId &&
        e.targetId === edgeA.targetId &&
        e.relationshipType === edgeA.relationshipType
      );

      if (!edgeB) {
        gaps.push({
          sourceNodeId: edgeA.sourceId,
          targetNodeId: edgeA.targetId,
          relationshipType: edgeA.relationshipType,
          severity: "missing",
          description: `Relationship '${edgeA.relationshipType}' from ${edgeA.sourceId} to ${edgeA.targetId} was present in State A but is entirely absent in State B.`,
          sourceState: "A",
          targetState: "B",
        });
      } else if (Math.abs(edgeA.weight - edgeB.weight) > 0.7) {
        gaps.push({
          sourceNodeId: edgeA.sourceId,
          targetNodeId: edgeA.targetId,
          relationshipType: edgeA.relationshipType,
          severity: "weakened",
          description: `Relationship '${edgeA.relationshipType}' between ${edgeA.sourceId} and ${edgeA.targetId} has significantly weakened (Weight A: ${edgeA.weight.toFixed(2)} vs Weight B: ${edgeB.weight.toFixed(2)}).`,
          sourceState: "A",
          targetState: "B",
        });
      }
    }

    // 2. Check for conceptual drift (e.g., relationship exists but context changed significantly)
    // This is a placeholder for advanced semantic analysis, here we check for node content drift.
    const commonNodes = new Set<string>();
    nodeMapA.forEach((_, id) => {
      if (nodeMapB.has(id)) {
        commonNodes.add(id);
      }
    });

    for (const nodeId of commonNodes) {
      const nodeA = nodeMapA.get(nodeId)!;
      const nodeB = nodeMapB.get(nodeId)!;

      if (nodeA.type === "CONCEPT" && nodeB.type === "CONCEPT") {
        // Simulate checking for semantic drift based on content change
        if (nodeA.content.keywords && nodeB.content.keywords) {
          const intersection = new Set(nodeA.content.keywords.filter(k => nodeB.content.keywords.includes(k)));
          const jaccardSimilarity = intersection.size / Math.max(nodeA.content.keywords.length, nodeB.content.keywords.length);

          if (jaccardSimilarity < 0.5 && nodeA.content.keywords.length > 1 && nodeB.content.keywords.length > 1) {
             gaps.push({
                sourceNodeId: nodeId,
                targetNodeId: nodeId,
                relationshipType: "SELF_CONCEPT",
                severity: "drifted",
                description: `Conceptual drift detected for node ${nodeId}. Keyword similarity dropped below 50% (Jaccard: ${jaccardSimilarity.toFixed(2)}).`,
                sourceState: "A",
                targetState: "B",
            });
          }
        }
      }
    }

    return gaps;
  }

  public diffGraphs(): GraphDiff {
    const nodeMapA = this.getNodeMap(this.stateA);
    const nodeMapB = this.getNodeMap(this.stateB);

    const nodeDiff = this.compareNodes(nodeMapA, nodeMapB);
    const edgeMapA = this.getEdgeMap(this.stateA);
    const edgeMapB = this.getEdgeMap(this.stateB);
    const edgeDiff = this.compareEdges(edgeMapA, edgeMapB);

    const conceptualGaps = this.detectConceptualGaps(this.stateA, this.stateB);

    return {
      addedNodes: nodeDiff.added,
      removedNodes: nodeDiff.removed,
      modifiedNodes: nodeDiff.modified,
      addedEdges: edgeDiff.added,
      removedEdges: edgeDiff.removed,
      modifiedEdges: edgeDiff.modified,
      conceptualGaps: conceptualGaps,
    };
  }
}