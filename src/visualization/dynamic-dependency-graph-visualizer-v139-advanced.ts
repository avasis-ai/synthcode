import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; result: string };

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  type: "temporal" | "resource" | "capability" | "call";
  metadata: Record<string, any>;
}

export interface GraphNode {
  id: string;
  type: "agent" | "tool" | "concept";
  label: string;
  metadata: Record<string, any>;
}

export interface EnrichedGraphPayload {
  nodes: GraphNode[];
  edges: DependencyEdge[];
  history: Message[];
  loopEvents: LoopEvent[];
}

export class DynamicDependencyGraphVisualizer {
  private payload: EnrichedGraphPayload;

  constructor(payload: EnrichedGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): void {
    console.log("--- Rendering Advanced Dependency Graph ---");
    console.log(`Total Nodes: ${this.payload.nodes.length}`);
    console.log(`Total Edges: ${this.payload.edges.length}`);
    console.log("Visualization pipeline initiated...");
    this.processAndVisualize();
  }

  private processAndVisualize(): void {
    const filteredEdges = this.filterEdges(null);
    const visualizationData = {
      nodes: this.payload.nodes,
      edges: filteredEdges,
      metadata: {
        history: this.payload.history,
        loopEvents: this.payload.loopEvents,
      },
    };

    this.renderNodes(visualizationData.nodes);
    this.renderEdges(visualizationData.edges);
    this.renderMetadataOverlays(visualizationData.metadata);
    console.log("Graph rendering complete.");
  }

  public setFilter(constraintType: "temporal" | "resource" | "capability" | "call" | null): void {
    console.log(`\n--- Applying Filter: ${constraintType || 'All Types'} ---`);
    const filteredEdges = this.filterEdges(constraintType);
    const visualizationData = {
      nodes: this.payload.nodes,
      edges: filteredEdges,
      metadata: {
        history: this.payload.history,
        loopEvents: this.payload.loopEvents,
      },
    };
    this.renderNodes(visualizationData.nodes);
    this.renderEdges(visualizationData.edges);
    this.renderMetadataOverlays(visualizationData.metadata);
  }

  private filterEdges(constraintType: "temporal" | "resource" | "capability" | "call" | null): DependencyEdge[] {
    if (constraintType) {
      return this.payload.edges.filter(edge => edge.type === constraintType);
    }
    return this.payload.edges;
  }

  private renderNodes(nodes: GraphNode[]): void {
    console.log("\n[Nodes Rendered]");
    nodes.forEach(node => {
      console.log(`  - ${node.id} (${node.type}): ${node.label}`);
    });
  }

  private renderEdges(edges: DependencyEdge[]): void {
    console.log("\n[Edges Rendered]");
    if (edges.length === 0) {
      console.log("  No edges to display based on current filters.");
      return;
    }
    edges.forEach(edge => {
      console.log(`  -> ${edge.sourceId} --(${edge.type})--> ${edge.targetId} [Meta: ${JSON.stringify(edge.metadata)}]`);
    });
  }

  private renderMetadataOverlays(metadata: { history: Message[]; loopEvents: LoopEvent[] }): void {
    console.log("\n[Metadata Overlays]");
    console.log(`  History Messages Count: ${metadata.history.length}`);
    console.log(`  Loop Events Count: ${metadata.loopEvents.length}`);
  }
}