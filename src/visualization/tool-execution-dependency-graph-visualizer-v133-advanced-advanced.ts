import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceUsage {
  resourceName: string;
  usageAmount: number;
  unit: string;
}

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  description: string;
}

export interface AdvancedNodeMetadata {
  nodeId: string;
  startTime: number;
  endTime: number;
  resourcesUsed: ResourceUsage[];
  constraints: TemporalConstraint[];
  isError: boolean;
}

export interface AdvancedEdgeMetadata {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  dependencyType: "direct" | "indirect" | "conditional";
  temporalOverlap: {
    overlapStart: number;
    overlapEnd: number;
  } | null;
  resourceBottleneck: ResourceUsage | null;
}

export interface ToolExecutionGraphData {
  nodes: Record<string, AdvancedNodeMetadata>;
  edges: Record<string, AdvancedEdgeMetadata>;
}

export class ToolExecutionDependencyGraphVisualizer {
  private graphData: ToolExecutionGraphData;

  constructor(graphData: ToolExecutionGraphData) {
    this.graphData = graphData;
  }

  private getColorForNode(metadata: AdvancedNodeMetadata): string {
    if (metadata.isError) {
      return "red";
    }
    if (metadata.constraints.length > 0) {
      return "orange";
    }
    return "blue";
  }

  private getEdgeStyle(metadata: AdvancedEdgeMetadata): {
    color: string;
    style: string;
  } {
    if (metadata.resourceBottleneck) {
      return { color: "purple", style: "dashed" };
    }
    if (metadata.dependencyType === "conditional") {
      return { color: "green", style: "dotted" };
    }
    return { color: "gray", style: "solid" };
  }

  public visualize(containerElementId: string): void {
    const container = document.getElementById(containerElementId);
    if (!container) {
      console.error(`Container element with ID "${containerElementId}" not found.`);
      return;
    }

    container.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "800px");

    // 1. Draw Edges (Handle Overlaps and Bottlenecks)
    Object.values(this.graphData.edges).forEach((edgeMeta) => {
      const { color, style } = this.getEdgeStyle(edgeMeta);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", this.calculatePath(edgeMeta));
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-dasharray", style === "dashed" ? "5,3" : style === "dotted" ? "2,2" : "none");
      svg.appendChild(path);

      if (edgeMeta.temporalOverlap) {
        const overlapRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        overlapRect.setAttribute("x", 10);
        overlapRect.setAttribute("y", 10);
        overlapRect.setAttribute("width", 50);
        overlapRect.setAttribute("height", 20);
        overlapRect.setAttribute("fill", "yellow");
        overlapRect.setAttribute("opacity", "0.5");
        svg.appendChild(overlapRect);
      }
    });

    // 2. Draw Nodes (Handle State and Resources)
    Object.values(this.graphData.nodes).forEach((nodeMeta) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", 50 + Math.random() * 300);
      circle.setAttribute("cy", 50 + Math.random() * 200);
      circle.setAttribute("r", "30");
      circle.setAttribute("fill", this.getColorForNode(nodeMeta));
      circle.setAttribute("stroke", "#333");
      circle.setAttribute("stroke-width", "2");
      svg.appendChild(circle);

      // Add metadata overlay (e.g., resource usage summary)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", 50 + Math.random() * 300 + 35);
      text.setAttribute("y", 50 + Math.random() * 200 + 10);
      text.setAttribute("font-size", "12px");
      text.textContent = `Time: ${nodeMeta.startTime}-${nodeMeta.endTime} | Resources: ${nodeMeta.resourcesUsed.length}`;
      svg.appendChild(text);
    });

    container.appendChild(svg);
  }

  private calculatePath(edgeMeta: AdvancedEdgeMetadata): string {
    // Simplified path calculation for demonstration
    const startX = 100;
    const startY = 100;
    const endX = 300;
    const endY = 200;
    return `M ${startX} ${startY} C ${startX + 50} ${startY - 20}, ${endX - 50} ${endY + 20}, ${endX} ${endY}`;
  }
}