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

export interface StandardEdge {
  source: string;
  target: string;
  type: "call" | "response";
}

export interface ContextualEdge {
  source: string;
  target: string;
  relevanceScore: number;
  contextualType: "semantic_flow" | "shared_knowledge";
}

export interface GraphPayload {
  nodes: Record<string, { label: string; type: "user" | "assistant" | "tool"; metadata: Record<string, unknown> }>;
  standardEdges: StandardEdge[];
  contextualEdges: ContextualEdge[];
}

export interface VisualizerOptions {
  nodeSizeScale: (score: number) => number;
  edgeThicknessScale: (score: number) => number;
  colorMap: {
    [key: string]: string;
  };
}

export class ContextualDependencyGraphVisualizer {
  private options: VisualizerOptions;

  constructor(options: VisualizerOptions) {
    this.options = options;
  }

  private calculateNodeMetadata(message: Message): Record<string, unknown> {
    if ("user" in message) {
      return { role: "user", content: message.content.text };
    }
    if ("assistant" in message) {
      const content = message.content.filter((block): block is TextBlock | ToolUseBlock | ThinkingBlock => block.type !== "text" || (typeof block === "TextBlock" && block.type === "text"));
      return { role: "assistant", contentBlocks: content.map(block => block.type === "text" ? block.text : block.type) };
    }
    if ("tool_use_id" in message) {
      return { role: "tool", tool_use_id: message.tool_use_id, content: message.content };
    }
    return { role: "unknown" };
  }

  private extractGraphPayload(messages: Message[]): GraphPayload {
    const nodes: Record<string, { label: string; type: "user" | "assistant" | "tool"; metadata: Record<string, unknown> }> = {};
    const standardEdges: StandardEdge[] = [];
    const contextualEdges: ContextualEdge[] = [];

    let nodeIdCounter = 0;

    const getNodeAndId = (message: Message): { id: string; node: { label: string; type: "user" | "assistant" | "tool"; metadata: Record<string, unknown> } } => {
      const id = `node_${nodeIdCounter++}`;
      const nodeType = typeof message === "user" ? "user" : (typeof message === "assistant" ? "assistant" : "tool");
      const node = {
        label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodeIdCounter}`,
        type: nodeType,
        metadata: this.calculateNodeMetadata(message),
      };
      nodes[id] = node;
      return { id, node };
    };

    let previousNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const { id: currentNodeId, node: currentNode } = getNodeAndId(message);

      if (previousNodeId) {
        // 1. Standard Edge (Sequential Dependency)
        standardEdges.push({
          source: previousNodeId,
          target: currentNodeId,
          type: i > 0 ? "call" : "start",
        });

        // 2. Contextual Edge (Simulated/Placeholder for advanced logic)
        // In a real scenario, this would analyze content similarity or shared concepts.
        const relevance = Math.min(1.0, Math.abs(i - (i - 1)) * 0.1 + Math.random() * 0.2);
        contextualEdges.push({
          source: previousNodeId,
          target: currentNodeId,
          relevanceScore: relevance,
          contextualType: "semantic_flow",
        });
      }
      previousNodeId = currentNodeId;
    }

    return {
      nodes,
      standardEdges,
      contextualEdges,
    };
  }

  public visualize(messages: Message[]): { graphPayload: GraphPayload; visualizationData: any } {
    const graphPayload = this.extractGraphPayload(messages);

    // Simulate visualization data generation based on payload and options
    const visualizationData = {
      nodes: Object.values(graphPayload.nodes).map(node => ({
        id: Object.keys(graphPayload.nodes).find(key => graphPayload.nodes[key] === node)!,
        label: node.label,
        type: node.type,
        size: this.options.nodeSizeScale(1.0), // Placeholder scale
        color: this.options.colorMap[node.type] || "#ccc",
      })),
      edges: [
        ...graphPayload.standardEdges.map(edge => ({
          source: edge.source,
          target: edge.target,
          thickness: this.options.edgeThicknessScale(1.0),
          style: { type: "solid", color: "#333" },
        })),
        ...graphPayload.contextualEdges.map(edge => ({
          source: edge.source,
          target: edge.target,
          thickness: this.options.edgeThicknessScale(edge.relevanceScore),
          style: { type: "dashed", color: `rgba(0, 120, ${Math.round(edge.relevanceScore * 255)}, ${edge.relevanceScore * 0.8 + 0.2})` },
          context: edge,
        })),
      ],
    };

    return { graphPayload, visualizationData };
  }
}