import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface ResourceMetadata {
  resourceName: string;
  usageAmount: number;
  unit: string;
}

export interface AdvancedGraphPayload {
  temporal?: TemporalMetadata;
  resource?: ResourceMetadata;
  sourceContexts?: Record<string, string>;
}

export interface GraphNode {
  id: string;
  label: string;
  payload: AdvancedGraphPayload;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  payload: AdvancedGraphPayload;
}

export class ContextualDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private renderNodePayload(node: GraphNode): string {
    const { payload } = node;
    let details = "";
    if (payload.temporal) {
      details += `[Time: ${payload.temporal.startTime} - ${payload.temporal.endTime}] `;
    }
    if (payload.resource) {
      details += `[Resource: ${payload.resource.resourceName} (${payload.resource.usageAmount}${payload.resource.unit})] `;
    }
    if (payload.sourceContexts && Object.keys(payload.sourceContexts).length > 0) {
      details += `[Sources: ${Object.keys(payload.sourceContexts).join(', ')}]`;
    }
    return details || "No advanced payload";
  }

  private renderEdgePayload(edge: GraphEdge): string {
    const { payload } = edge;
    let details = "";
    if (payload.temporal) {
      details += `[Time: ${payload.temporal.startTime} - ${payload.temporal.endTime}] `;
    }
    if (payload.resource) {
      details += `[Resource: ${payload.resource.resourceName} (${payload.resource.usageAmount}${payload.resource.unit})] `;
    }
    if (payload.sourceContexts && Object.keys(payload.sourceContexts).length > 0) {
      details += `[Sources: ${Object.keys(payload.sourceContexts).join(', ')}]`;
    }
    return details || "No advanced payload";
  }

  public visualize(): { nodesHtml: string; edgesHtml: string } {
    const nodeHtml = this.nodes.map((node, index) => {
      const payloadDisplay = this.renderNodePayload(node);
      return `<div class="graph-node" id="node-${index}">
        <h3>${node.label}</h3>
        <p>Payload: ${payloadDisplay}</p>
        <div class="node-details">${JSON.stringify(node.payload, null, 2)}</div>
      </div>`;
    }).join("");

    const edgeHtml = this.edges.map((edge, index) => {
      const payloadDisplay = this.renderEdgePayload(edge);
      return `<div class="graph-edge" id="edge-${index}">
        <p>From: ${edge.sourceId} -> To: ${edge.targetId}</p>
        <p>Payload: ${payloadDisplay}</p>
        <div class="edge-details">${JSON.stringify(edge.payload, null, 2)}</div>
      </div>`;
    }).join("");

    return { nodesHtml: nodeHtml, edgesHtml: edgeHtml };
  }

  public static createVisualization(nodes: GraphNode[], edges: GraphEdge[]): { nodesHtml: string; edgesHtml: string } {
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, edges);
    return visualizer.visualize();
  }
}