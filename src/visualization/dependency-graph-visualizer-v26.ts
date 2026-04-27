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

export interface ResourceUsage {
  resourceId: string;
  requiredAmount: number;
  unit: string;
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface TemporalDependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  timeWindow: TimeWindow;
  resourceUsage: ResourceUsage[];
  dependencyType: "causal" | "resource_constrained";
}

export interface NodeData {
  id: string;
  type: "user" | "assistant" | "tool";
  label: string;
  metadata: Record<string, unknown>;
}

export interface GraphState {
  nodes: NodeData[];
  edges: TemporalDependencyEdge[];
}

export interface ViewFilter {
  timeRange: { startMs: number; endMs: number };
  minResourceSaturation: number;
}

export class DependencyGraphVisualizerV26 {
  private graphState: GraphState;
  private filter: ViewFilter;

  constructor(initialState: GraphState, initialFilter: ViewFilter) {
    this.graphState = initialState;
    this.filter = initialFilter;
  }

  public setGraphState(state: GraphState): void {
    this.graphState = state;
  }

  public setFilter(filter: ViewFilter): void {
    this.filter = filter;
  }

  private filterEdges(edges: TemporalDependencyEdge[]): TemporalDependencyEdge[] {
    return edges.filter(edge => {
      const { timeWindow, resourceUsage } = edge;
      const timePasses =
        timeWindow.startTimeMs >= this.filter.timeRange.startMs &&
        timeWindow.endTimeMs <= this.filter.timeRange.endMs;

      const resourceSaturated = resourceUsage.every(
        (usage) => usage.requiredAmount <= this.filter.minResourceSaturation
      );

      return timePasses && resourceSaturated;
    });
  }

  private filterNodes(nodes: NodeData[]): NodeData[] {
    // Simple node filtering based on time/resource relevance (placeholder logic)
    return nodes.filter(node => {
      // In a real scenario, node metadata would contain time/resource info
      return true;
    });
  }

  public getVisibleGraphData(): { nodes: NodeData[]; edges: TemporalDependencyEdge[] } {
    const visibleNodes = this.filterNodes(this.graphState.nodes);
    const visibleEdges = this.filterEdges(this.graphState.edges);

    return {
      nodes: visibleNodes,
      edges: visibleEdges,
    };
  }

  public renderVisualization(
    visibleData: { nodes: NodeData[]; edges: TemporalDependencyEdge[] }
  ): string {
    const { nodes, edges } = visibleData;

    let html = `<div><h2>Dependency Graph (V26)</h2>`;

    html += `<h3>Nodes (${nodes.length})</h3><ul>`;
    nodes.forEach(node => {
      html += `<li>[${node.type.toUpperCase()}] ${node.label} (ID: ${node.id})</li>`;
    });
    html += `</ul>`;

    html += `<h3>Edges (${edges.length})</h3>`;
    edges.forEach((edge, index) => {
      const resourceInfo = edge.resourceUsage.map(
        (r) => `${r.resourceId}:${r.requiredAmount}/${r.unit}`
      ).join(", ");
      html += `
        <div style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
          <strong>${edge.sourceNodeId}</strong> -> <strong>${edge.targetNodeId}</strong>
          <p>Type: ${edge.dependencyType}</p>
          <p>Time Window: ${edge.timeWindow.startTimeMs}ms to ${edge.timeWindow.endTimeMs}ms</p>
          <p>Resources: ${resourceInfo}</p>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }
}