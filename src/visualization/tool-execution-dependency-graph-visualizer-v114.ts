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

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  timeWindowStart: number;
  timeWindowEnd: number;
}

export interface TemporalEdgeMetadata {
  dependencyType: "causal" | "resource_contention" | "temporal_sequence";
  latencyMs: number;
  resourceConstraints: ResourceConstraint[];
}

export interface DependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  metadata: TemporalEdgeMetadata;
}

export interface DependencyGraphData {
  nodes: Record<string, { id: string; label: string; position: { x: number; y: number } }>;
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV114 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  public visualize(): string {
    const nodeCount = Object.keys(this.graphData.nodes).length;
    const edgeCount = this.graphData.edges.length;

    let visualizationHtml = `
      <div class="dependency-graph-v114" style="position: relative; width: 100%; height: 600px;">
        <div class="graph-info">
          <p>Visualization Engine: ToolExecutionDependencyGraphVisualizerV114</p>
          <p>Nodes Rendered: ${nodeCount}</p>
          <p>Edges Rendered: ${edgeCount}</p>
          <p>Focus: Causality, Temporal Flow, and Resource Contention.</p>
        </div>
        <svg width="100%" height="100%" id="dependency-svg"></svg>
        <div class="legend">
          <h4>Edge Legend</h4>
          <p><span style="display:inline-block; width:10px; height:2px; background-color:red;"></span> Causal Dependency</p>
          <p><span style="display:inline-block; width:10px; height:2px; background-color:orange;"></span> Resource Contention</p>
          <p><span style="display:inline-block; width:10px; height:2px; background-color:blue;"></span> Temporal Sequence</p>
        </div>
      </div>
    `;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 1000 600");

    this.renderNodes(svg);
    this.renderEdges(svg);

    const container = document.createElement("div");
    container.innerHTML = visualizationHtml;
    container.querySelector("#dependency-svg")!.appendChild(svg);

    return container.outerHTML;
  }

  private renderNodes(svg: SVGElement): void {
    for (const nodeId in this.graphData.nodes) {
      const nodeData = this.graphData.nodes[nodeId];
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", nodeData.position.x.toString());
      circle.setAttribute("cy", nodeData.position.y.toString());
      circle.setAttribute("r", "15");
      circle.setAttribute("fill", "#4a90e2");
      circle.setAttribute("stroke", "#357abd");
      circle.setAttribute("stroke-width", "2");
      circle.classList.add("node-element");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", nodeData.position.x + 20);
      text.setAttribute("y", nodeData.position.y + 5);
      text.setAttribute("font-size", "14");
      text.setAttribute("fill", "#333");
      text.textContent = nodeData.label;

      svg.appendChild(circle);
      svg.appendChild(text);
    }
  }

  private renderEdges(svg: SVGElement): void {
    this.graphData.edges.forEach(edge => {
      const source = this.graphData.nodes[edge.sourceNodeId]?.position;
      const target = this.graphData.nodes[edge.targetNodeId]?.position;

      if (!source || !target) return;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", source.x.toString());
      line.setAttribute("y1", source.y.toString());
      line.setAttribute("x2", target.x.toString());
      line.setAttribute("y2", target.y.toString());
      line.setAttribute("stroke-width", "3");
      line.setAttribute("marker-end", "url(#arrowhead)");

      let strokeColor = "gray";
      let metadata = edge.metadata;

      if (metadata.dependencyType === "causal") {
        strokeColor = "red";
      } else if (metadata.dependencyType === "resource_contention") {
        strokeColor = "orange";
      } else if (metadata.dependencyType === "temporal_sequence") {
        strokeColor = "blue";
      }

      line.setAttribute("stroke", strokeColor);
      line.classList.add("dependency-edge");

      // Add visual indicator for resource contention (e.g., thicker/dashed)
      if (metadata.resourceConstraints.length > 0) {
        line.setAttribute("stroke-dasharray", "5,5");
      }

      svg.appendChild(line);
    });
  }
}