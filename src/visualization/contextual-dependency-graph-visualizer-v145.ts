import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface NodeMetadata {
  nodeId: string;
  resourceUsage: {
    cpuMs: number;
    memoryKb: number;
  };
  startTimeMs: number;
  endTimeMs: number;
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  durationMs: number;
  requiredResource: string;
}

export interface EnrichedGraphPayload {
  nodes: Record<string, NodeMetadata>;
  edges: Record<string, EdgeMetadata[]>;
  dependencies: {
    sourceId: string;
    targetId: string;
    metadata: EdgeMetadata;
  }[];
}

export class ContextualDependencyGraphVisualizerV145 {
  private graphPayload: EnrichedGraphPayload | null = null;

  constructor() {}

  public setGraphPayload(payload: EnrichedGraphPayload): void {
    this.graphPayload = payload;
  }

  public processAndVisualize(): void {
    if (!this.graphPayload) {
      console.error("Graph payload has not been set. Cannot visualize.");
      return;
    }

    const { nodes, edges, dependencies } = this.graphPayload;

    console.log("--- Contextual Dependency Graph Visualization V1.4.5 ---");

    this.visualizeNodes(nodes);
    this.visualizeEdges(dependencies);

    console.log("Visualization complete. Temporal and resource constraints integrated.");
  }

  private visualizeNodes(nodes: Record<string, NodeMetadata>): void {
    console.log("\n[Node Visualization]");
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      console.log(`  Node ID: ${nodeId}`);
      console.log(`    Time Range: ${node.startTimeMs}ms -> ${node.endTimeMs}ms`);
      console.log(`    Resource Usage: CPU=${node.resourceUsage.cpuMs}ms, Memory=${node.resourceUsage.memoryKb}KB`);
    }
  }

  private visualizeEdges(dependencies: {
    sourceId: string;
    targetId: string;
    metadata: EdgeMetadata;
  }[]): void {
    console.log("\n[Edge Visualization (Dependencies)]");
    if (dependencies.length === 0) {
      console.log("  No explicit dependencies found.");
      return;
    }

    for (const dep of dependencies) {
      const { sourceId, targetId, metadata } = dep;
      console.log(`  Edge: ${sourceId} -> ${targetId}`);
      console.log(`    Duration: ${metadata.durationMs}ms`);
      console.log(`    Constraint: Requires ${metadata.requiredResource}`);
    }
  }
}