import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synth-code-types";

export interface ResourceMetrics {
  cpu_usage_percent: number;
  memory_usage_mb: number;
  network_latency_ms: number;
}

export interface TemporalConstraint {
  start_time_ms: number;
  end_time_ms: number;
}

export interface ToolInvocationNode {
  id: string;
  tool_name: string;
  input_payload: Record<string, unknown>;
  execution_time_ms: number;
  resource_metrics: ResourceMetrics;
  temporal_constraints: TemporalConstraint;
  messages: Message[];
}

export interface ToolInvocationEdge {
  source_node_id: string;
  target_node_id: string;
  dependency_type: "direct" | "indirect" | "conditional";
  dependency_strength: number;
  transfer_data_size_bytes: number;
  temporal_dependency: {
    required_after_ms: number;
    max_delay_ms: number;
  };
}

export interface DependencyGraphPayload {
  nodes: ToolInvocationNode[];
  edges: ToolInvocationEdge[];
  history_messages: Message[];
}

export class ToolInvocationDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  private getNodeById(id: string): ToolInvocationNode | undefined {
    return this.payload.nodes.find((node) => node.id === id);
  }

  private getEdgeDetails(edge: ToolInvocationEdge): { source: ToolInvocationNode; target: ToolInvocationNode } | undefined {
    const source = this.getNodeById(edge.source_node_id);
    const target = this.getNodeById(edge.target_node_id);
    if (source && target) {
      return { source, target };
    }
    return undefined;
  }

  public renderGraph(
    filterResource: { metric: keyof ResourceMetrics; threshold: number } | null,
    filterTimeWindow: { startMs: number; endMs: number } | null
  ): { svgContent: string; metadata: Record<string, any> } {
    let filteredNodes: ToolInvocationNode[] = [...this.payload.nodes];
    let filteredEdges: ToolInvocationEdge[] = [...this.payload.edges];

    if (filterResource) {
      filteredNodes = filteredNodes.filter((node) => {
        const metricValue = node.resource_metrics[filterResource.metric];
        return metricValue <= filterResource.threshold;
      });
    }

    if (filterTimeWindow) {
      filteredNodes = filteredNodes.filter((node) => {
        return node.temporal_constraints.start_time_ms >= filterTimeWindow.startMs &&
          node.temporal_constraints.end_time_ms <= filterTimeWindow.endMs;
      });
    }

    const visibleEdges: ToolInvocationEdge[] = [];
    const visibleNodesMap = new Set(filteredNodes.map((node) => node.id));

    for (const edge of filteredEdges) {
      if (visibleNodesMap.has(edge.source_node_id) && visibleNodesMap.has(edge.target_node_id)) {
        visibleEdges.push(edge);
      }
    }

    const metadata = {
      nodeCount: filteredNodes.length,
      edgeCount: visibleEdges.length,
      resourceFilter: filterResource,
      timeFilter: filterTimeWindow,
    };

    const svgContent = this.generateSvgRepresentation(filteredNodes, visibleEdges);

    return { svgContent, metadata };
  }

  private generateSvgRepresentation(nodes: ToolInvocationNode[], edges: ToolInvocationEdge[]): string {
    let svg = `<svg width="100%" height="800px" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">`;

    // Draw Edges
    for (const edge of edges) {
      const details = this.getEdgeDetails(edge);
      if (!details) continue;

      const { source, target } = details;
      const x1 = 100 + (source.id.charCodeAt(0) % 10) * 100;
      const y1 = 100 + (source.id.charCodeAt(1) % 5) * 100;
      const x2 = 100 + (target.id.charCodeAt(0) % 10) * 100;
      const y2 = 100 + (target.id.charCodeAt(1) % 5) * 100;

      const strokeColor = edge.dependency_strength > 0.8 ? "red" : "blue";
      const strokeWidth = edge.dependency_strength * 3 + 1;

      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }

    // Draw Nodes
    for (const node of nodes) {
      const x = 100 + (node.id.charCodeAt(0) % 10) * 100;
      const y = 100 + (node.id.charCodeAt(1) % 5) * 100;
      const resourceColor = node.resource_metrics.cpu_usage_percent > 80 ? "orange" : "green";

      svg += `<rect x="${x-50}" y="${y-30}" width="100" height="60" rx="10" fill="#eee" stroke="#333" />`;
      svg += `<text x="${x}" y="${y-10}" text-anchor="middle" font-size="14" font-weight="bold">${node.tool_name}</text>`;
      svg += `<text x="${x}" y="${y+15}" text-anchor="middle" font-size="10" fill="${resourceColor}">CPU: ${node.resource_metrics.cpu_usage_percent.toFixed(1)}%</text>`;
    }

    svg += `</svg>`;
    return svg;
  }
}