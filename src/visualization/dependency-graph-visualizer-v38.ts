import { GraphData } from "./graph-data-types";

export interface TemporalResourceMetadata {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface ToolNodeData extends GraphData {
  metadata: TemporalResourceMetadata;
}

export interface DependencyGraphData extends GraphData {
  nodes: ToolNodeData[];
  edges: {
    source: string;
    target: string;
    metadata: {
      dependencyType: "sequential" | "parallel" | "conditional";
      temporalConstraint: string;
      resourceFlow: Record<string, number>;
    };
  }[];
}

export class ToolDependencyGraphVisualizerV38 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private _calculateLayout(data: DependencyGraphData): { x: number; y: number }[] {
    const nodePositions: { x: number; y: number }[] = [];
    // Simplified layout calculation for demonstration
    let currentY = 0;
    for (const node of data.nodes) {
      nodePositions.push({ x: 100, y: currentY });
      currentY += 100;
    }
    return nodePositions;
  }

  private _renderStandardGraph(positions: { x: number; y: number }[]): string {
    let svgContent = `<svg width="1000" height="800">`;

    // Render Nodes
    for (let i = 0; i < this.graphData.nodes.length; i++) {
      const node = this.graphData.nodes[i];
      svgContent += `<rect x="${positions[i].x - 50}" y="${positions[i].y - 20}" width="100" height="40" fill="#eee" stroke="#333" />`;
      svgContent += `<text x="${positions[i].x}" y="${positions[i].y + 5}" text-anchor="middle">${node.id}</text>`;
    }

    // Render Edges
    for (const edge of this.graphData.edges) {
      svgContent += `<line x1="${positions[this.graphData.edges.indexOf(edge).source].x}" y1="${positions[this.graphData.edges.indexOf(edge).source].y}" x2="${positions[this.graphData.edges.indexOf(edge).target].x}" y2="${positions[this.graphData.edges.indexOf(edge).target].y}" stroke="gray" stroke-width="2" />`;
    }

    svgContent += `</svg>`;
    return svgContent;
  }

  private _renderTemporalLayer(positions: { x: number; y: number }[]): string {
    let svgContent = `<g id="temporal-layer">`;

    // Simulate rendering temporal flow (e.g., curved, time-based connections)
    for (const edge of this.graphData.edges) {
      const sourcePos = positions[this.graphData.edges.indexOf(edge).source];
      const targetPos = positions[this.graphData.edges.indexOf(edge).target];

      // Visualization of temporal constraint (e.g., a colored arc indicating duration)
      const duration = (edge.metadata.resourceFlow["time"] || 1) * 10;
      svgContent += `<path d="M ${sourcePos.x} ${sourcePos.y + 20} Q ${sourcePos.x + 50} ${sourcePos.y + 20 + duration/2} ${targetPos.x} ${targetPos.y + 20}" stroke="red" stroke-width="3" fill="none" />`;
    }

    svgContent += `</g>`;
    return svgContent;
  }

  /**
   * Renders the dependency graph, optionally including advanced temporal and resource visualization.
   * @param includeTemporalLayer If true, renders temporal constraints and resource usage visualization.
   * @returns A string containing the combined SVG visualization.
   */
  public render(includeTemporalLayer: boolean = false): string {
    const positions = this._calculateLayout(this.graphData);
    let svg = this._renderStandardGraph(positions);

    if (includeTemporalLayer) {
      const temporalSvg = this._renderTemporalLayer(positions);
      // Combine the standard graph with the temporal layer
      svg = svg.replace("</svg>", `${temporalSvg}</svg>`);
    }

    return svg;
  }
}