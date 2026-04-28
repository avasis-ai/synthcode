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

export interface TemporalNodeData {
  id: string;
  type: "tool_execution" | "user_input" | "assistant_thought";
  startTime: number;
  endTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
  } | null;
  metadata?: Record<string, any>;
}

export interface TemporalEdgeData {
  sourceId: string;
  targetId: string;
  startTime: number;
  endTime: number;
  resourceFlow: {
    cpu: number;
    memory: number;
  } | null;
  metadata?: Record<string, any>;
}

export interface DependencyGraphData {
  nodes: TemporalNodeData[];
  edges: TemporalEdgeData[];
}

export class ToolExecutionDependencyGraphVisualizerV118 {
  private graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private renderNode(node: TemporalNodeData): string {
    const { id, type, startTime, endTime, resourceUsage, metadata } = node;
    const duration = endTime - startTime;
    const resourceBar = resourceUsage
      ? `Resource: CPU=${resourceUsage.cpu.toFixed(2)}, Mem=${resourceUsage.memory.toFixed(2)}`
      : "Resource: N/A";

    return `
      <g id="node-${id}">
        <rect x="10" y="10" width="200" height="80" fill="#e0f7fa" stroke="#00bcd4" stroke-width="2"/>
        <text x="110" y="30" font-size="14" font-weight="bold">${type.toUpperCase()}</text>
        <text x="110" y="55" font-size="12">${metadata?.description || `Duration: ${duration.toFixed(1)}ms`}</text>
        <text x="10" y="100" font-size="10" fill="#555">${resourceBar}</text>
      </g>
    `;
  }

  private renderEdge(edge: TemporalEdgeData): string {
    const { sourceId, targetId, startTime, endTime, resourceFlow, metadata } = edge;
    const duration = endTime - startTime;
    const resourceInfo = resourceFlow
      ? `Flow: CPU=${resourceFlow.cpu.toFixed(2)}, Mem=${resourceFlow.memory.toFixed(2)}`
      : "Flow: N/A";

    return `
      <g id="edge-${sourceId}-${targetId}">
        <path d="M 210, ${this.getNodeY(sourceId)} C 350, ${this.getNodeY(sourceId)}, 350, ${this.getNodeY(targetId)}, 210, ${this.getNodeY(targetId)}" stroke="#4caf50" stroke-width="3" fill="none" />
        <text x="220" y="${this.getNodeY(sourceId) - 10}" font-size="10" fill="#4caf50">${resourceInfo}</text>
        <text x="220" y="${this.getNodeY(targetId) + 15}" font-size="10" fill="#4caf50">${metadata?.reason || `Duration: ${duration.toFixed(1)}ms`}</text>
      </g>
    `;
  }

  private getNodeY(nodeId: string): number {
    const node = this.graphData.nodes.find(n => n.id === nodeId);
    return node ? 100 + (this.graphData.nodes.indexOf(node) % 3) * 50 : 100;
  }

  public renderGraph(): string {
    let nodeHtml = this.graphData.nodes.map(this.renderNode).join("");
    let edgeHtml = this.graphData.edges.map(this.renderEdge).join("");

    return `
      <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <title>Temporal Dependency Graph</title>
        ${nodeHtml}
        ${edgeHtml}
      </svg>
    `;
  }
}