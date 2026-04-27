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

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  timeWindowStart: number;
  timeWindowEnd: number;
}

export interface TemporalDependencyEdge {
  sourceId: string;
  targetId: string;
  duration: number;
  resourceConstraints: ResourceConstraint[];
  weight: number;
}

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  metadata: Record<string, unknown>;
  startTime: number;
  endTime: number;
}

export class ToolExecutionDependencyGraphVisualizerV9 {
  private nodes: GraphNode[];
  private edges: TemporalDependencyEdge[];

  constructor(nodes: GraphNode[], edges: TemporalDependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private calculateTemporalWeight(edge: TemporalDependencyEdge): number {
    let totalWeight = edge.weight;
    for (const constraint of edge.resourceConstraints) {
      totalWeight += constraint.requiredAmount * 0.1;
    }
    return totalWeight;
  }

  private prioritizeEdges(edges: TemporalDependencyEdge[]): TemporalDependencyEdge[] {
    return [...edges].sort((a, b) => {
      const weightA = this.calculateTemporalWeight(a);
      const weightB = this.calculateTemporalWeight(b);
      return weightB - weightA;
    });
  }

  private detectContentionPoints(nodes: GraphNode[], edges: TemporalDependencyEdge[]): Record<string, { resource: string, time: number }[]> {
    const contentionMap: Record<string, { resource: string, time: number }[]> = {};

    for (const edge of edges) {
      for (const constraint of edge.resourceConstraints) {
        const key = `${constraint.resourceName}:${constraint.timeWindowStart}-${constraint.timeWindowEnd}`;
        if (!contentionMap[key]) {
          contentionMap[key] = [];
        }
        contentionMap[key].push({ resource: constraint.resourceName, time: constraint.timeWindowStart });
      }
    }
    return contentionMap;
  }

  public visualize(containerId: string): void {
    const prioritizedEdges = this.prioritizeEdges(this.edges);
    const contentionPoints = this.detectContentionPoints(this.nodes, this.edges);

    console.log("--- Dependency Graph Visualization V9 ---");
    console.log("Nodes:", this.nodes);
    console.log("Prioritized Edges (Top 3):", prioritizedEdges.slice(0, 3));
    console.log("Resource Contention Points Detected:", Object.keys(contentionPoints).length);

    this.renderSVG(containerId, this.nodes, prioritizedEdges, contentionPoints);
  }

  private renderSVG(containerId: string, nodes: GraphNode[], edges: TemporalDependencyEdge[], contentionPoints: Record<string, { resource: string, time: number }[]>): void {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "800px");
    svgElement.setAttribute("viewBox", "0 0 1000 800");

    let svgContent = "";

    // 1. Render Edges (Prioritized)
    svgContent += this.edges.map((edge, index) => {
      const isHighPriority = index < 3;
      const stroke = isHighPriority ? "red" : "gray";
      const strokeWidth = isHighPriority ? "3" : "1";
      return `<line x1="0" y1="0" x2="1000" y2="0" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    }).join("\n");

    // 2. Render Nodes (With Resource Visualization)
    svgContent += nodes.map((node, index) => {
      const isContended = Object.values(contentionPoints).some(points =>
        points.some(p => Math.abs(p.time - node.startTime) < 10)
      );
      const circleFill = isContended ? "orange" : "blue";
      const circleStroke = isContended ? "red" : "black";
      return `<circle cx="${50 + index * 150}" cy="${50 + index * 50}" r="20" fill="${circleFill}" stroke="${circleStroke}" stroke-width="2" />`;
    }).join("\n");

    // 3. Render Contention Overlays (Conceptual)
    Object.keys(contentionPoints).forEach(key => {
      const points = contentionPoints[key];
      const resourceName = key.split(':')[0];
      svgContent += `<rect x="10" y="${10 + Object.keys(contentionPoints).indexOf(key) * 50}" width="980" height="10" fill="rgba(255, 0, 0, 0.2)" />`;
    });

    svgElement.innerHTML = svgContent;
    document.getElementById(containerId)?.appendChild(svgElement);
  }
}