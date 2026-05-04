import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalConstraint {
  start: number;
  end: number;
}

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  conflictColor: string;
}

export interface CapabilityConstraint {
  capability: string;
  level: "READ" | "WRITE" | "EXECUTE";
}

export interface AdvancedNodeMetadata {
  temporal?: TemporalConstraint[];
  resources?: ResourceConstraint[];
  capabilities?: CapabilityConstraint[];
}

export interface AdvancedEdgeMetadata {
  temporal?: TemporalConstraint[];
  resources?: ResourceConstraint[];
  capabilities?: CapabilityConstraint[];
}

export interface DependencyGraphContext {
  nodes: Record<string, {
    id: string;
    name: string;
    metadata: AdvancedNodeMetadata;
  }>;
  edges: Record<string, {
    source: string;
    target: string;
    metadata: AdvancedEdgeMetadata;
  }>;
}

export class ContextualDependencyGraphVisualizerAdvancedAdvanced {
  private context: DependencyGraphContext;

  constructor(context: DependencyGraphContext) {
    this.context = context;
  }

  private _getEdgeStyle(edgeId: string): {
    stroke: string;
    strokeWidth: number;
    style: React.CSSProperties;
  } {
    const edgeMeta = this.context.edges[edgeId]?.metadata;
    let baseColor = "#999";
    let baseWidth = 1.5;

    if (edgeMeta?.resources) {
      const conflicts = edgeMeta.resources.filter(r => r.conflictColor);
      if (conflicts.length > 0) {
        baseColor = "red";
        baseWidth = 3;
      }
    }

    return {
      stroke: baseColor,
      strokeWidth: baseWidth,
      style: {
        transition: "all 0.3s ease",
      },
    };
  }

  private _getNodeStyle(nodeId: string): {
    fill: string;
    stroke: string;
    r: number;
  } {
    const nodeMeta = this.context.nodes[nodeId]?.metadata;
    let baseFill = "#3498db";
    let baseStroke = "#2980b9";
    let radius = 15;

    if (nodeMeta?.resources) {
      const conflicts = nodeMeta.resources.filter(r => r.conflictColor);
      if (conflicts.length > 0) {
        baseFill = "red";
        baseStroke = "darkred";
      }
    }

    return {
      fill: baseFill,
      stroke: baseStroke,
      r: radius,
    };
  }

  public renderGraph(): {
    nodeStyles: Record<string, { fill: string; stroke: string; r: number }>;
    edgeStyles: Record<string, { stroke: string; strokeWidth: number; style: React.CSSProperties }>;
    renderOrder: string[];
  } {
    const nodeStyles: Record<string, { fill: string; stroke: string; r: number }> = {};
    const edgeStyles: Record<string, { stroke: string; strokeWidth: number; style: React.CSSProperties }> = {};
    const renderOrder: string[] = [];

    for (const nodeId in this.context.nodes) {
      nodeStyles[nodeId] = this._getNodeStyle(nodeId);
    }

    for (const edgeId in this.context.edges) {
      edgeStyles[edgeId] = this._getEdgeStyle(edgeId);
    }

    // Simple topological sort approximation for rendering order
    const allNodes = Object.keys(this.context.nodes);
    const adj: Record<string, string[]> = {};
    allNodes.forEach(nodeId => adj[nodeId] = []);

    for (const edgeId in this.context.edges) {
      const edge = this.context.edges[edgeId];
      adj[edge.source]!.push(edge.target);
    }

    // Basic DFS for ordering
    const visited = new Set<string>();
    const stack: string[] = allNodes;
    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        renderOrder.push(nodeId);
        const neighbors = adj[nodeId] || [];
        for (let i = neighbors.length - 1; i >= 0; i--) {
          const neighbor = neighbors[i];
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }

    return {
      nodeStyles,
      edgeStyles,
      renderOrder,
    };
  }
}