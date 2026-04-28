import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceMetadata {
  resourceName: string;
  usageAmount: number;
  unit: string;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface GraphNode {
  id: string;
  label: string;
  metadata: {
    temporal: TemporalMetadata;
    resources: ResourceMetadata[];
  };
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  metadata: {
    temporal: TemporalMetadata;
    resources: ResourceMetadata[];
    dependencyType: "sequential" | "parallel" | "conditional";
  };
}

export interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type SVGElement = {
  setAttribute: (name: string, value: string) => void;
  appendChild: (element: SVGElement) => void;
};

export function renderDependencyGraph(
  payload: DependencyGraphPayload,
  container: SVGElement,
  width: number,
  height: number
): void {
  container.innerHTML = "";

  const svg = container as any; // Assuming container is already an SVG element context
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  const nodePositions: Map<string, { x: number; y: number }> = new Map();

  // Simple layout simulation: place nodes linearly for demonstration
  const nodeCount = payload.nodes.length;
  const spacing = Math.max(50, Math.min(width / (nodeCount + 1), 100));

  payload.nodes.forEach((node, index) => {
    const x = spacing * (index + 1);
    const y = 50 + (index % 3) * 100; // Simple vertical stacking for multiple rows
    nodePositions.set(node.id, { x, y });
  });

  // Draw Edges
  payload.edges.forEach((edge) => {
    const fromPos = nodePositions.get(edge.fromNodeId);
    const toPos = nodePositions.get(edge.toNodeId);

    if (!fromPos || !toPos) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(fromPos.x));
    line.setAttribute("y1", String(fromPos.y));
    line.setAttribute("x2", String(toPos.x));
    line.setAttribute("y2", String(toPos.y));
    line.setAttribute("stroke", "#999");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(line);
  });

  // Draw Nodes
  payload.nodes.forEach((node) => {
    const pos = nodePositions.get(node.id);
    if (!pos) return;

    // Node Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(pos.x));
    circle.setAttribute("cy", String(pos.y));
    circle.setAttribute("r", "20");
    circle.setAttribute("fill", "#4CAF50");
    circle.setAttribute("stroke", "#388E3C");
    circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);

    // Node Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(pos.x));
    text.setAttribute("y", String(pos.y) + ""));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "14px");
    text.setAttribute("fill", "#333");
    text.textContent = node.label;
    svg.appendChild(text);

    // Tooltip/Metadata Placeholder (Conceptual: In a real D3 app, this would be complex interaction)
    const metadataText = `Duration: ${node.metadata.temporal.durationMs}ms`;
    const resourceText = node.metadata.resources.map(r => `${r.resourceName}: ${r.usageAmount}${r.unit}`).join(", ");
    const info = document.createElementNS("http://www.w3.org/2000/svg", "text");
    info.setAttribute("x", String(pos.x));
    info.setAttribute("y", String(pos.y + 35));
    info.setAttribute("text-anchor", "middle");
    info.setAttribute("font-size", "10px");
    info.setAttribute("fill", "#666");
    info.textContent = `Res: ${resourceText || 'None'}`;
    svg.appendChild(info);
  });
}