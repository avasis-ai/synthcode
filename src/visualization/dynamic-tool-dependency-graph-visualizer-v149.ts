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

export interface TemporalResourceMetadata {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  metadata: TemporalResourceMetadata;
}

export interface NodeData {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  metadata?: TemporalResourceMetadata;
}

export interface EnrichedGraphPayload {
  nodes: NodeData[];
  edges: DependencyEdge[];
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  private calculateEdgeColor(metadata: TemporalResourceMetadata): string {
    const duration = metadata.endTime - metadata.startTime;
    if (duration < 1000) {
      return "rgba(255, 165, 0, 0.8)"; // Orange for very fast/short
    }
    if (metadata.resourceUsage["cpu"] > 0.8) {
      return "rgba(255, 99, 71, 0.9)"; // Reddish for high CPU
    }
    return "rgba(70, 130, 180, 0.8)"; // SteelBlue default
  }

  private calculateNodeStyle(node: NodeData): { backgroundColor: string; borderColor: string } {
    switch (node.type) {
      case "user":
        return { backgroundColor: "#e6e6fa", borderColor: "#9370db" }; // Lavender
      case "assistant":
        return { backgroundColor: "#f0f8ff", borderColor: "#4682b4" }; // LightBlue
      case "tool":
        return { backgroundColor: "#fffacd", borderColor: "#daa520" }; // Yellowish
      default:
        return { backgroundColor: "#ffffff", borderColor: "#cccccc" };
    }
  }

  public renderGraph(): void {
    console.log("--- Rendering Dynamic Tool Dependency Graph (v149) ---");
    console.log(`Nodes found: ${this.payload.nodes.length}`);
    console.log(`Edges found: ${this.payload.edges.length}`);

    this.payload.nodes.forEach(node => {
      const style = this.calculateNodeStyle(node);
      console.log(`[Node ${node.id}]: Type=${node.type}, Style=${JSON.stringify(style)}`);
    });

    this.payload.edges.forEach((edge, index) => {
      const color = this.calculateEdgeColor(edge.metadata);
      console.log(`[Edge ${index}]: ${edge.sourceId} -> ${edge.targetId}. Color=${color}. Duration=${edge.metadata.endTime - edge.metadata.startTime}ms.`);
    });

    console.log("------------------------------------------------------");
  }

  public visualize(payload: EnrichedGraphPayload): void {
    this.payload = payload;
    this.renderGraph();
  }
}