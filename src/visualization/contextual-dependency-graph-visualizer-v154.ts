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

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

export interface Constraint {
  type: "temporal" | "resource";
  value: number;
  unit: "seconds" | "units";
}

export interface ContextualDependencyEdge extends DependencyEdge {
  constraints: Constraint[];
  violationSeverity: "none" | "low" | "medium" | "high";
}

export interface GraphNode {
  id: string;
  label: string;
  data: Record<string, unknown>;
}

export interface ContextualGraph {
  nodes: GraphNode[];
  edges: ContextualDependencyEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private graph: ContextualGraph;

  constructor(graph: ContextualGraph) {
    this.graph = graph;
  }

  public visualize(): {
    svgContent: string;
    metadata: Record<string, any>;
  } {
    const { nodes, edges } = this.graph;

    const nodeMetadata = nodes.reduce((acc, node) => {
      acc[node.id] = {
        label: node.label,
        data: node.data,
      };
      return acc;
    }, {} as Record<string, { label: string; data: Record<string, unknown> }>);

    const edgeMetadata = edges.map(edge => ({
      source: edge.sourceId,
      target: edge.targetId,
      weight: edge.weight,
      constraints: edge.constraints,
      violationSeverity: edge.violationSeverity,
    }));

    const svgContent = this.generateSvg(nodes, edges, nodeMetadata, edgeMetadata);

    return {
      svgContent,
      metadata: {
        nodes: nodeMetadata,
        edges: edgeMetadata,
      },
    };
  }

  private generateSvg(
    nodes: GraphNode[],
    edges: ContextualDependencyEdge[],
    nodeMetadata: Record<string, { label: string; data: Record<string, unknown> }>,
    edgeMetadata: {
      source: string;
      target: string;
      weight: number;
      constraints: Constraint[];
      violationSeverity: "none" | "low" | "medium" | "high";
    }[]
  ): string {
    let svg = `<svg width="1000" height="600" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">`;

    // Draw edges first (to be underneath nodes)
    edges.forEach((edge, index) => {
      const severityColor = this.getSeverityColor(edge.violationSeverity);
      const strokeWidth = 2 + (edge.weight * 0.5);
      const constraintInfo = this.formatConstraints(edge.constraints);

      svg += `<g class="edge" data-edge-id="${index}">`;
      svg += `<path d="M ${edge.sourceId} 50 Q 500 50, ${edge.targetId} 50" stroke="${severityColor}" stroke-width="${strokeWidth}" fill="none" />`;
      svg += `<title>Dependency: ${edge.sourceId} -> ${edge.targetId}. Severity: ${edge.violationSeverity}. Constraints: ${constraintInfo}</title>`;
      svg += `</g>`;
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      const nodeData = nodeMetadata[node.id];
      const fillColor = nodeData?.data?.type === "tool" ? "#ADD8E6" : "#D3D3D3";
      const strokeColor = "#333";

      svg += `<g class="node" data-node-id="${node.id}">`;
      svg += `<rect x="50" y="${50 + (index * 100)}" width="200" height="80" rx="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />`;
      svg += `<text x="100" y="100" font-size="16" font-weight="bold">${node.label}</text>`;
      svg += `<text x="100" y="130" font-size="12" fill="#555">${JSON.stringify(nodeData.data)}</text>`;
      svg += `</g>`;
    });

    svg += `</svg>`;
    return svg;
  }

  private getSeverityColor(severity: "none" | "low" | "medium" | "high"): string {
    switch (severity) {
      case "none":
        return "#28a745";
      case "low":
        return "#ffc107";
      case "medium":
        return "#fd7e14";
      case "high":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  }

  private formatConstraints(constraints: Constraint[]): string {
    if (constraints.length === 0) {
      return "None";
    }
    return constraints.map(c => `${c.type}: ${c.value} ${c.unit}`).join("; ");
  }
}