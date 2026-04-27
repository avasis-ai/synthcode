import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  label: string;
  type: "message" | "tool_call" | "user_input";
  startTime: number;
  endTime: number;
  resources: Record<string, number>;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: "causal" | "temporal" | "resource_constraint";
  weight: number;
  description: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class DependencyGraphVisualizerV35 {
  private readonly graphData: DependencyGraphData;

  constructor(graphData: DependencyGraphData) {
    this.graphData = graphData;
  }

  private mapMessageToNode(message: Message, index: number): GraphNode {
    let label = "";
    let type: "message" | "tool_call" | "user_input" = "message";

    if (message.role === "user") {
      type = "user_input";
      label = `User Input (${index})`;
    } else if (message.role === "assistant") {
      label = `Assistant Response (${index})`;
    } else if (message.role === "tool") {
      type = "tool_call";
      label = `Tool Result (${index})`;
    }

    return {
      id: `node_${index}`,
      label: label,
      type: type,
      startTime: Date.now() - (index * 1000),
      endTime: Date.now(),
      resources: { cpu: 1, memory: 100 },
    };
  }

  private extractNodesFromContext(context: Message[]): GraphNode[] {
    const nodes: GraphNode[] = [];
    context.forEach((message, index) => {
      nodes.push(this.mapMessageToNode(message, index));
    });
    return nodes;
  }

  private generateEdges(nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        fromNodeId: nodes[i].id,
        toNodeId: nodes[i + 1].id,
        dependencyType: "causal",
        weight: 1.0,
        description: "Sequential execution flow",
      });
    }
    return edges;
  }

  public visualize(context: Message[]): { svgOutput: string, abstractRepresentation: any } {
    const nodes = this.extractNodesFromContext(context);
    const edges = this.generateEdges(nodes);

    const graphData: DependencyGraphData = { nodes, edges };

    const abstractRepresentation = {
      nodes: graphData.nodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
      edges: graphData.edges.map(e => ({ from: e.fromNodeId, to: e.toNodeId, type: e.dependencyType })),
    };

    const svgOutput = this.renderToSvg(graphData);

    return { svgOutput, abstractRepresentation };
  }

  private renderToSvg(data: DependencyGraphData): string {
    const nodeCount = data.nodes.length;
    if (nodeCount === 0) return "";

    let svg = `<svg width="1000" height="${nodeCount * 100}" viewBox="0 0 1000 ${nodeCount * 100}">`;

    data.nodes.forEach((node, i) => {
      svg += `<rect x="50" y="${i * 100}" width="900" height="80" fill="#eee" stroke="#ccc" rx="10" ry="10" />`;
      svg += `<text x="50" y="${i * 100 + 30}" font-size="16">${node.label}</text>`;
      svg += `<text x="50" y="${i * 100 + 55}" font-size="12" fill="#666">Type: ${node.type}</text>`;
    });

    data.edges.forEach((edge, i) => {
      const y1 = (i) * 100 + 40;
      const y2 = (i + 1) * 100 + 40;
      svg += `<line x1="500" y1="${y1}" x2="500" y2="${y2}" stroke="#333" stroke-width="2" />`;
    });

    svg += `</svg>`;
    return svg;
  }
}