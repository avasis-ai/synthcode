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

export interface ToolNode {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
}

export interface FlowEdge {
  sourceNodeId: string;
  sourceOutputKey: string;
  targetNodeId: string;
  targetInputKey: string;
  dataName: string;
}

export class ToolDependencyGraphVisualizerV3 {
  private nodes: Map<string, ToolNode>;
  private controlEdges: { sourceId: string; targetId: string }[];
  private dataFlowEdges: FlowEdge[];

  constructor(nodes: ToolNode[], controlEdges: { sourceId: string; targetId: string }[], dataFlowEdges: FlowEdge[]) {
    this.nodes = new Map(nodes.map(node => [node.id, node]));
    this.controlEdges = controlEdges;
    this.dataFlowEdges = dataFlowEdges;
  }

  private getNodeById(id: string): ToolNode | undefined {
    return this.nodes.get(id);
  }

  public visualizeGraph(): { nodes: ToolNode[]; controlEdges: { sourceId: string; targetId: string }[]; dataFlowEdges: FlowEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      controlEdges: this.controlEdges,
      dataFlowEdges: this.dataFlowEdges,
    };
  }

  public renderDataFlowPaths(): void {
    if (this.dataFlowEdges.length === 0) {
      console.log("No explicit data flow paths to render.");
      return;
    }

    console.log("--- Rendering Data Flow Paths (V3) ---");
    this.dataFlowEdges.forEach((edge, index) => {
      const source = this.getNodeById(edge.sourceNodeId);
      const target = this.getNodeById(edge.targetNodeId);

      if (source && target) {
        console.log(
          `[Flow ${index + 1}] Data Path: "${edge.dataName}" from ${source.name} (${edge.sourceOutputKey}) -> ${target.name} (${edge.targetInputKey})`
        );
      } else {
        console.warn(`[Flow ${index + 1}] Could not find nodes for edge: ${JSON.stringify(edge)}`);
      }
    });

    console.log("--------------------------------------");
  }
}