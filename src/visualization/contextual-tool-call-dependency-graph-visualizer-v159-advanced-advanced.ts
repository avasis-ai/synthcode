import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ConstraintSeverity = "none" | "low" | "medium" | "high" | "critical";

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface ResourceMetadata {
  resourceName: string;
  requiredUnits: number;
  availableUnits: number;
}

export interface CapabilityMetadata {
  capabilityName: string;
  isRequired: boolean;
  level: "basic" | "advanced" | "expert";
}

export interface AdvancedEdgeMetadata {
  temporal: TemporalMetadata;
  resources: ResourceMetadata[];
  capabilities: CapabilityMetadata[];
  violationSeverity: ConstraintSeverity;
}

export interface AdvancedNodeMetadata {
  toolCallId: string;
  inputSchema: Record<string, unknown>;
  requiredCapabilities: CapabilityMetadata[];
}

export interface AdvancedGraphEdge {
  sourceNodeId: string;
  targetNodeId: string;
  metadata: AdvancedEdgeMetadata;
}

export interface AdvancedGraphNode {
  nodeId: string;
  messageRole: "user" | "assistant" | "tool";
  metadata: AdvancedNodeMetadata;
}

export interface AdvancedGraphData {
  nodes: AdvancedGraphNode[];
  edges: AdvancedGraphEdge[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private graphData: AdvancedGraphData;

  constructor(graphData: AdvancedGraphData) {
    this.graphData = graphData;
  }

  private calculateEdgeStyle(metadata: AdvancedEdgeMetadata): { color: string; thickness: number } {
    let color = "#ccc";
    let thickness = 1;

    if (metadata.violationSeverity === "critical") {
      color = "red";
      thickness = 3;
    } else if (metadata.violationSeverity === "high") {
      color = "orange";
      thickness = 2;
    } else if (metadata.violationSeverity === "medium") {
      color = "yellowgreen";
      thickness = 1.5;
    } else if (metadata.violationSeverity === "low") {
      color = "blue";
      thickness = 1;
    }

    return { color, thickness };
  }

  private calculateNodeStyle(metadata: AdvancedNodeMetadata): { backgroundColor: string; borderColor: string } {
    let backgroundColor = "#e0f7fa";
    let borderColor = "#00bcd4";

    if (metadata.requiredCapabilities.some(c => c.level === "expert")) {
      backgroundColor = "#c8e6c9";
      borderColor = "#4caf50";
    }
    return { backgroundColor, borderColor };
  }

  public renderVisualization(): { nodes: any[]; edges: any[]; styleMap: Record<string, any> } {
    const styledNodes: any[] = this.graphData.nodes.map(node => ({
      id: node.nodeId,
      label: `${node.messageRole.toUpperCase()} Node`,
      style: this.calculateNodeStyle(node.metadata),
      metadata: node.metadata,
    }));

    const styledEdges: any[] = this.graphData.edges.map(edge => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      style: this.calculateEdgeStyle(edge.metadata),
      metadata: edge.metadata,
    }));

    const styleMap: Record<string, any> = {
      edgeStyle: (edge: AdvancedGraphEdge) => this.calculateEdgeStyle(edge.metadata),
      nodeStyle: (node: AdvancedGraphNode) => this.calculateNodeStyle(node.metadata),
    };

    return {
      nodes: styledNodes,
      edges: styledEdges,
      styleMap: styleMap,
    };
  }
}