import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type GraphNodeId = string;
export type GraphEdgeId = string;

export interface GraphNode {
  id: GraphNodeId;
  labels: string[];
  properties: Record<string, any>;
  capabilities: Record<string, {
    description: string;
    version: string;
    deprecated: boolean;
  }>;
  temporalContext: {
    validFrom: Date;
    validTo: Date;
  };
}

export interface GraphEdge {
  id: GraphEdgeId;
  source: GraphNodeId;
  target: GraphNodeId;
  type: string;
  properties: Record<string, any>;
  temporalContext: {
    validFrom: Date;
    validTo: Date;
  };
}

export interface KnowledgeGraph {
  nodes: Record<GraphNodeId, GraphNode>;
  edges: Record<GraphEdgeId, GraphEdge>;
}

export interface ContextualGraphDiffPayload {
  timeWindowStart: Date;
  timeWindowEnd: Date;
  activeConstraints: Record<string, any>;
  activeCapabilities: Set<string>;
}

export interface StructuralDiff {
  nodeChanges: {
    id: GraphNodeId;
    operation: "ADDED" | "DELETED" | "MODIFIED";
    details?: "Node properties changed" | "Node labels changed";
  }[];
  edgeChanges: {
    id: GraphEdgeId;
    operation: "ADDED" | "DELETED" | "MODIFIED";
    details?: "Edge properties changed" | "Edge relationship type changed";
  }[];
}

export interface SemanticDiff {
  nodeDrift: {
    nodeId: GraphNodeId;
    property: string;
    message: string;
    severity: "WARNING" | "ERROR";
  }[];
  edgeDrift: {
    edgeId: GraphEdgeId;
    property: string;
    message: string;
    severity: "WARNING" | "ERROR";
  }[];
}

export interface ConstraintViolation {
  source: "NODE" | "EDGE";
  id: GraphNodeId | GraphEdgeId;
  constraintKey: string;
  violationMessage: string;
}

export interface GraphDiffReport {
  structural: StructuralDiff;
  semantic: SemanticDiff;
  constraints: ConstraintViolation[];
  summary: {
    structuralChanges: number;
    semanticIssues: number;
    constraintViolations: number;
  };
}

class ContextualKnowledgeGraphDiffer {
  private graphA: KnowledgeGraph;
  private graphB: KnowledgeGraph;
  private payload: ContextualGraphDiffPayload;

  constructor(graphA: KnowledgeGraph, graphB: KnowledgeGraph, payload: ContextualGraphDiffPayload) {
    this.graphA = graphA;
    this.graphB = graphB;
    this.payload = payload;
  }

  private diffNodes(nodesA: Record<GraphNodeId, GraphNode>, nodesB: Record<GraphNodeId, GraphNode>): {
    structural: StructuralDiff['nodeChanges'];
    semantic: SemanticDiff['nodeDrift'];
  } {
    const structural: StructuralDiff['nodeChanges'] = [];
    const semantic: SemanticDiff['nodeDrift'] = [];
    const allIds = new Set([...Object.keys(nodesA), ...Object.keys(nodesB)]);

    for (const id of allIds) {
      const nodeA = nodesA[id];
      const nodeB = nodesB[id];

      if (!nodeA) {
        structural.push({ id, operation: "ADDED" });
      } else if (!nodeB) {
        structural.push({ id, operation: "DELETED" });
      } else {
        // Check for modifications
        if (JSON.stringify(nodeA.properties) !== JSON.stringify(nodeB.properties) ||
            nodeA.labels.some(label => !nodeB.labels.includes(label)) ||
            nodeB.labels.some(label => !nodeA.labels.includes(label))) {
          structural.push({ id, operation: "MODIFIED", details: "Node properties changed" });
        }

        // Semantic Drift Check (Simplified: comparing capability versions)
        for (const capKey of Object.keys(nodeA.capabilities).concat(Object.keys(nodeB.capabilities))) {
          const capA = nodeA.capabilities[capKey];
          const capB = nodeB.capabilities[capKey];

          if (!capA && capB) {
            semantic.push({
              nodeId: id,
              property: `capability:${capKey}`,
              message: `Capability ${capKey} appeared in B but not A.`,
              severity: "WARNING",
            });
          } else if (capA && !capB) {
            semantic.push({
              nodeId: id,
              property: `capability:${capKey}`,
              message: `Capability ${capKey} was removed from node ${id}.`,
              severity: "WARNING",
            });
          } else if (capA?.version !== capB?.version) {
            semantic.push({
              nodeId: id,
              property: `capability:${capKey}`,
              message: `Capability ${capKey} version changed from ${capA.version} to ${capB.version}.`,
              severity: "WARNING",
            });
          }
        }
      }
    }
    return { structural: structural, semantic: semantic };
  }

  private diffEdges(edgesA: Record<GraphEdgeId, GraphEdge>, edgesB: Record<GraphEdgeId, GraphEdge>): {
    structural: StructuralDiff['edgeChanges'];
    semantic: SemanticDiff['edgeDrift'];
  } {
    const structural: StructuralDiff['edgeChanges'] = [];
    const semantic: SemanticDiff['edgeDrift'] = [];
    const allIds = new Set([...Object.keys(edgesA), ...Object.keys(edgesB)]);

    for (const id of allIds) {
      const edgeA = edgesA[id];
      const edgeB = edgesB[id];

      if (!edgeA) {
        structural.push({ id, operation: "ADDED" });
      } else if (!edgeB) {
        structural.push({ id, operation: "DELETED" });
      } else {
        // Check for modifications
        if (JSON.stringify(edgeA.properties) !== JSON.stringify(edgeB.properties) ||
            edgeA.type !== edgeB.type) {
          structural.push({ id, operation: "MODIFIED", details: "Edge properties changed" });
        }

        // Semantic Drift Check (Simplified: checking temporal context change)
        if (edgeA.temporalContext.validFrom.getTime() !== edgeB.temporalContext.validFrom.getTime()) {
          semantic.push({
            edgeId: id,
            property: "temporalContext.validFrom",
            message: `Temporal context start changed from ${edgeA.temporalContext.validFrom.toISOString()} to ${edgeB.temporalContext.validFrom.toISOString()}.`,
            severity: "WARNING",
          });
        }
      }
    }
    return { structural: structural, semantic: semantic };
  }

  private checkConstraints(graphA: KnowledgeGraph, graphB: KnowledgeGraph): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    // Constraint Check 1: Temporal Overlap Violation (Simplified check on edges)
    for (const edgeId in graphB.edges) {
      const edgeB = graphB.edges[edgeId];
      if (edgeB.temporalContext.validFrom > this.payload.timeWindowEnd || edgeB.temporalContext.validTo < this.payload.timeWindowStart) {
        violations.push({
          source: "EDGE",
          id: edgeId,
          constraintKey: "TimeWindowValidity",
          violationMessage: `Edge ${edgeId} is entirely outside the defined time window [${this.payload.timeWindowStart.toISOString()} - ${this.payload.timeWindowEnd.toISOString()}].`,
        });
      }
    }

    // Constraint Check 2: Capability Deprecation Violation (Checking if active capabilities are deprecated)
    for (const nodeId in graphB.nodes) {
      const nodeB = graphB.nodes[nodeId];
      for (const capKey in nodeB.capabilities) {
        const capability = nodeB.capabilities[capKey];
        if (capability.deprecated && this.payload.activeCapabilities.has(capKey)) {
          violations.push({
            source: "NODE",
            id: nodeId,
            constraintKey: "ActiveCapabilityDeprecation",
            violationMessage: `Node ${nodeId} uses deprecated capability ${capKey} (Version: ${capability.version}).`,
          });
        }
      }
    }

    return violations;
  }

  public generateReport(): GraphDiffReport {
    const nodeDiff = this.diffNodes(this.graphA.nodes, this.graphB.nodes);
    const edgeDiff = this.diffEdges(this.graphA.edges, this.graphB.edges);
    const constraintViolations = this.checkConstraints(this.graphA, this.graphB);

    const structural: StructuralDiff = {
      nodeChanges: nodeDiff.structural,
      edgeChanges: edgeDiff.structural,
    };

    const semantic: SemanticDiff = {
      nodeDrift: [...nodeDiff.semantic, ...edgeDiff.semantic],
      edgeDrift: [...nodeDiff.semantic, ...edgeDiff.semantic], // Reusing structure for simplicity in this advanced example
    };

    return {
      structural: structural,
      semantic: semantic,
      constraints: constraintViolations,
      summary: {
        structuralChanges: structural.nodeChanges.length + structural.edgeChanges.length,
        semanticIssues: nodeDiff.semantic.length + edgeDiff.semantic.length,
        constraintViolations: constraintViolations.length,
      },
    };
  }
}

export { ContextualKnowledgeGraphDiffer };