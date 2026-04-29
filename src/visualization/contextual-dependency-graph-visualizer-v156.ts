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

export type ContextualEdge = {
  sourceId: string;
  targetId: string;
  contextRelevanceScore: number;
};

export interface DependencyGraphContext {
  messages: Message[];
  edges: ContextualEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private readonly MIN_RELEVANCE_THRESHOLD: number;

  constructor(minRelevanceThreshold: number = 0.3) {
    this.MIN_RELEVANCE_THRESHOLD = minRelevanceThreshold;
  }

  public visualize(context: DependencyGraphContext): {
    nodes: Record<string, any>;
    edges: {
      source: string;
      target: string;
      thickness: number;
      color: string;
      label: string;
    }[];
    filteredContext: DependencyGraphContext;
  } {
    const { messages, edges } = context;

    const nodes: Record<string, any> = this.generateNodes(messages);
    const processedEdges = this.processEdges(edges);
    const filteredContext: DependencyGraphContext = {
      messages: messages,
      edges: processedEdges.filter(e => e.contextRelevanceScore >= this.MIN_RELEVANCE_THRESHOLD),
    };

    const visualEdges = this.mapEdgesToVisualFormat(processedEdges);

    return {
      nodes,
      edges: visualEdges,
      filteredContext,
    };
  }

  private generateNodes(messages: Message[]): Record<string, any> {
    const nodes: Record<string, any> = {};
    let nodeIdCounter = 0;

    const getNode = (content: string, role: string): string => {
      const id = `node_${nodeIdCounter++}`;
      nodes[id] = {
        id: id,
        label: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
        role: role,
        content: content,
      };
      return id;
    };

    messages.forEach((message, index) => {
      let contentSummary = "";
      let role = "unknown";

      if (message.role === "user") {
        contentSummary = message.content;
        role = "user";
        getNode(contentSummary, role);
      } else if (message.role === "assistant") {
        const contentText = message.content.map(block => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");
        contentSummary = contentText.substring(0, 50) + (contentText.length > 50 ? "..." : "");
        role = "assistant";
        getNode(contentSummary, role);
      } else if (message.role === "tool") {
        const contentText = message.content;
        contentSummary = `Tool Result: ${contentText.substring(0, 50)}...`;
        role = "tool";
        getNode(contentSummary, role);
      }
    });

    return nodes;
  }

  private processEdges(edges: ContextualEdge[]): ContextualEdge[] {
    return edges.map(edge => {
      // Simple normalization/enrichment logic placeholder
      const normalizedScore = Math.min(1.0, Math.max(0.0, edge.contextRelevanceScore));
      return {
        ...edge,
        contextRelevanceScore: normalizedScore,
      };
    });
  }

  private mapEdgesToVisualFormat(edges: ContextualEdge[]): {
    source: string;
    target: string;
    thickness: number;
    color: string;
    label: string;
  }[] {
    return edges.map(edge => {
      const thickness = 1 + edge.contextRelevanceScore * 3;
      const color = `rgba(50, 150, ${Math.floor(100 + edge.contextRelevanceScore * 100)}, ${edge.contextRelevanceScore * 0.8 + 0.2})`;
      const label = `Context: ${(edge.contextRelevanceScore * 100).toFixed(0)}%`;

      return {
        source: edge.sourceId,
        target: edge.targetId,
        thickness: parseFloat(thickness.toFixed(2)),
        color: color,
        label: label,
      };
    });
  }
}