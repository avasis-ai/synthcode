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

export interface DependencyNode {
  id: string;
  label: string;
  type: "tool" | "user" | "assistant";
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  fromId: string;
  toId: string;
  type: "call" | "response" | "dependency";
  weight: number;
}

export interface StateTransition {
  fromNodeId: string;
  toNodeId: string;
  stateMarker: "PRE_STATE" | "POST_STATE" | "TRANSITION";
  description: string;
}

export interface StatefulGraphPayload {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  stateTransitions: StateTransition[];
}

export class StatefulToolDependencyGraphVisualizer {
  private payload: StatefulGraphPayload;

  constructor(payload: StatefulGraphPayload) {
    this.payload = payload;
  }

  public getGraphData(): StatefulGraphPayload {
    return this.payload;
  }

  public visualize(): void {
    const { nodes, edges, stateTransitions } = this.payload;

    console.log("--- Stateful Dependency Graph Visualization ---");
    console.log(`Total Nodes: ${nodes.length}`);
    console.log(`Total Edges: ${edges.length}`);
    console.log(`Total State Transitions: ${stateTransitions.length}`);

    console.log("\n[Nodes]");
    nodes.forEach(node => {
      console.log(`- ID: ${node.id}, Label: ${node.label}, Type: ${node.type}`);
    });

    console.log("\n[Edges]");
    edges.forEach(edge => {
      console.log(`- ${edge.fromId} -> ${edge.toId} (${edge.type})`);
    });

    console.log("\n[State Transitions]");
    stateTransitions.forEach(transition => {
      let cue = "";
      if (transition.stateMarker === "PRE_STATE") {
        cue = " (Pre-State)";
      } else if (transition.stateMarker === "POST_STATE") {
        cue = " (Post-State)";
      } else {
        cue = " (Transition)";
      }
      console.log(`- ${transition.fromNodeId} -> ${transition.toNodeId}: ${transition.description}${cue}`);
    });

    console.log("\nVisualization Complete: State-aware rendering logic applied.");
  }

  public static createInitialPayload(
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    stateTransitions: StateTransition[]
  ): StatefulGraphPayload {
    return {
      nodes,
      edges,
      stateTransitions,
    };
  }
}