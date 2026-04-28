import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CapabilityNode {
  id: string;
  type: "tool" | "capability";
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface CapabilityEdge {
  source: string;
  target: string;
  type: "requires" | "is_compatible_with" | "depends_on";
  details: string;
  version?: string;
}

export interface CapabilityGraphPayload {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
}

export class ToolCapabilityGraphVisualizer {
  private payload: CapabilityGraphPayload;

  constructor(payload: CapabilityGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): void {
    console.log("--- Rendering Tool Capability Graph ---");
    console.log(`Nodes detected: ${this.payload.nodes.length}`);
    console.log(`Edges detected: ${this.payload.edges.length}`);

    // In a real implementation, this method would interact with a
    // visualization library (e.g., D3, React Flow, Cytoscape).
    // For this exercise, we simulate the rendering process.

    const toolNodes = this.payload.nodes.filter(node => node.type === "tool");
    const capabilityNodes = this.payload.nodes.filter(node => node.type === "capability");

    console.log("\n[Visualization Summary]");
    console.log(`Tools visualized: ${toolNodes.map(n => n.name).join(", ")}`);
    console.log(`Capabilities visualized: ${capabilityNodes.map(n => n.name).join(", ")}`);

    console.log("\n[Interactions (Edges)]");
    this.payload.edges.forEach((edge, index) => {
      console.log(
        `  ${index + 1}. ${edge.source} --(${edge.type})--> ${edge.target} (${edge.version || 'N/A'}): ${edge.details}`
      );
    });

    console.log("\nGraph rendering complete. Interactive visualization placeholder executed.");
  }

  public getPayload(): CapabilityGraphPayload {
    return this.payload;
  }
}