import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, any>;
  compatibilityScore: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: "requires" | "uses" | "flows_to";
  weight: number;
  metadata: Record<string, any>;
}

export interface DependencyGraphPayload {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export class ToolCapabilityDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const containerId = "dependency-graph-container";
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return "";
    }

    container.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "800px");
    svg.setAttribute("viewBox", "0 0 1000 800");
    svg.setAttribute("id", "graph-svg");

    // In a real implementation, we would use a library like D3.js here.
    // For this simulation, we'll generate placeholder SVG elements.

    let svgContent = "";

    // 1. Draw Edges (Placeholder)
    this.payload.edges.forEach((edge, index) => {
      const strokeColor = edge.weight > 0.7 ? "green" : edge.weight > 0.3 ? "orange" : "red";
      const thickness = Math.max(1, edge.weight * 3);
      svgContent += `<line x1="50" y1="${index * 100 + 50}" x2="950" y2="${index * 100 + 50}" stroke="${strokeColor}" stroke-width="${thickness}" />`;
    });

    // 2. Draw Nodes (Placeholder)
    this.payload.nodes.forEach((node, index) => {
      const circleRadius = 30;
      const x = 100 + (index % 3) * 300;
      const y = 50 + Math.floor(index / 3) * 150;

      svgContent += `<circle cx="${x}" cy="${y}" r="${circleRadius}" fill="#4a90e2" stroke="#357abd" stroke-width="3" />`;
      svgContent += `<text x="${x}" y="${y - 10}" text-anchor="middle" fill="#333" font-size="16">${node.name}</text>`;
      svgContent += `<text x="${x}" y="${y + 25}" text-anchor="middle" fill="#666" font-size="12">Score: ${node.compatibilityScore.toFixed(2)}</text>`;
    });

    svg.innerHTML = svgContent;
    container.appendChild(svg);

    this.addInteractivity(svg);

    return container.outerHTML;
  }

  private addInteractivity(svgElement: SVGElement): void {
    const container = document.getElementById("dependency-graph-container")!;
    
    container.onmouseover = (event: MouseEvent) => {
      const target = event.target as SVGElement;
      if (target.tagName === 'circle') {
        const nodeIndex = Array.from(target.parentNode!.children).indexOf(target);
        const node = this.payload.nodes[nodeIndex];
        if (node) {
          console.log(`Hovering over Node: ${node.name}. Metadata:`, node.metadata);
          // Simulate highlighting logic
          target.setAttribute('fill', '#ffc107');
        }
      }
    };

    container.onmouseout = (event: MouseEvent) => {
      const target = event.target as SVGElement;
      if (target.tagName === 'circle') {
        target.setAttribute('fill', '#4a90e2');
      }
    };
  }

  public filterByCompatibility(minScore: number): void {
    const filteredNodes = this.payload.nodes.filter(node => node.compatibilityScore >= minScore);
    console.log(`Filtered graph: Showing ${filteredNodes.length} nodes with score >= ${minScore}.`);
    // Re-render or update visualization based on filtered set
  }
}