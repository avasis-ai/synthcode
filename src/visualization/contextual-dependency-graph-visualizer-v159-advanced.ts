import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  availableCapacity: number;
  severity: "low" | "medium" | "high" | "violated";
}

export interface TemporalMetadata {
  startTimeMs: number;
  durationMs: number;
  deadlineMs: number;
  isCriticalPath: boolean;
}

export interface DependencyEdge {
  source: string;
  target: string;
  weight: number;
  constraints?: ResourceConstraint[];
  temporal?: TemporalMetadata;
}

export interface DependencyNode {
  id: string;
  label: string;
  metadata: Record<string, any>;
  constraints?: ResourceConstraint[];
  temporal?: TemporalMetadata;
}

export interface GraphInput {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private graphInput: GraphInput;

  constructor(graphInput: GraphInput) {
    this.graphInput = graphInput;
  }

  private calculateLayoutMetrics(nodes: DependencyNode[], edges: DependencyEdge[]): {
    nodePositions: Map<string, { x: number; y: number }>;
    edgeLayoutData: { source: string; target: string; x1: number; y1: number; x2: number; y2: number; }[];
  } {
    const nodePositions = new Map<string, { x: number; y: number }>();
    const edgeLayoutData: { source: string; target: string; x1: number; y1: number; x2: number; y2: number; }[] = [];

    // Simple circular layout approximation for demonstration
    const numNodes = nodes.length;
    const centerX = 500;
    const centerY = 500;
    const radius = 300;

    nodes.forEach((node, index) => {
      const angle = (index / numNodes) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });

    // Assign layout data based on calculated positions
    edges.forEach((edge, index) => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);

      if (sourcePos && targetPos) {
        edgeLayoutData.push({
          source: edge.source,
          target: edge.target,
          x1: sourcePos.x,
          y1: sourcePos.y,
          x2: targetPos.x,
          y2: targetPos.y,
        });
      }
    });

    return { nodePositions, edgeLayoutData };
  }

  private getConstraintStyle(constraints: ResourceConstraint[] | undefined): {
    nodeColor: string;
    edgeColor: string;
    violationMarker: string;
  } {
    if (!constraints || constraints.length === 0) {
      return { nodeColor: "#4CAF50", edgeColor: "#9E9E9E", violationMarker: "" };
    }

    const violated = constraints.some((c) => c.severity === "violated");
    const nearLimit = constraints.some((c) => c.severity === "high");

    let nodeColor = violated ? "#F44336" : (nearLimit ? "#FFC107" : "#4CAF50");
    let edgeColor = violated ? "#D32F2F" : (nearLimit ? "#FF9800" : "#607D8B");
    let violationMarker = violated ? "⚠️" : "";

    return { nodeColor, edgeColor, violationMarker };
  }

  public visualize(containerId: string): void {
    const { nodePositions, edgeLayoutData } = this.calculateLayoutMetrics(
      this.graphInput.nodes,
      this.graphInput.edges
    );

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return;
    }

    container.innerHTML = "";
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "600px";

    // 1. Draw Edges (with constraint visualization)
    edgeLayoutData.forEach((layout, index) => {
      const edge = this.graphInput.edges[index];
      const style = this.getConstraintStyle(edge.constraints);

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", `${layout.x1}`);
      line.setAttribute("y1", `${layout.y1}`);
      line.setAttribute("x2", `${layout.x2}`);
      line.setAttribute("y2", `${layout.y2}`);
      line.setAttribute("stroke", style.edgeColor);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("marker-end", "url(#arrowhead)");

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(line);

      // Add constraint label near the edge
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", `${(layout.x1 + layout.x2) / 2}`);
      text.setAttribute("y", `${(layout.y1 + layout.y2) / 2 - 15}`);
      text.setAttribute("font-size", "12px");
      text.setAttribute("fill", "#333");
      text.textContent = `[${edge.weight.toFixed(1)}] ${style.violationMarker}`;
      group.appendChild(text);

      container.appendChild(group);
    });

    // 2. Draw Nodes (with constraint visualization)
    this.graphInput.nodes.forEach((node, index) => {
      const pos = nodePositions.get(node.id)!;
      const style = this.getConstraintStyle(node.constraints);

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";

      // Node Circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", `${pos.x}`);
      circle.setAttribute("cy", `${pos.y}`);
      circle.setAttribute("r", "30");
      circle.setAttribute("fill", style.nodeColor);
      circle.setAttribute("stroke", "#333");
      circle.setAttribute("stroke-width", "2");

      // Constraint Marker
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "text");
      marker.setAttribute("x", `${pos.x - 15}`);
      marker.setAttribute("y", `${pos.y - 15}`);
      marker.setAttribute("font-size", "16px");
      marker.setAttribute("fill", "#333");
      marker.textContent = style.violationMarker;

      // Node Label
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", `${pos.x - 50}`);
      label.setAttribute("y", `${pos.y + 15}`);
      label.setAttribute("font-size", "14px");
      label.setAttribute("fill", "#333");
      label.textContent = node.label;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.appendChild(circle);
      g.appendChild(marker);
      g.appendChild(label);
      container.appendChild(g);
    });

    // Add SVG Defs for Arrows (to prevent drawing artifacts)
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.innerHTML = '<path d="M 0 0 L 10 5 L 0 10 z" fill="#9E9E9E" />';
    defs.appendChild(marker);
    container.appendChild(defs);
  }
}