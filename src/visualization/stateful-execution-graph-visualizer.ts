import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ToolExecutionState = {
  stateSnapshot: Record<string, unknown>;
  resourceUsage: Record<string, number>;
  constraintsViolated: string[];
};

export interface StatefulExecutionPayload {
  messages: Array<Message>;
  history: Array<{
    timestamp: number;
    state: ToolExecutionState;
    tool_result: ToolResultMessage | null;
  }>;
}

interface GraphNode {
  id: string;
  type: "message" | "tool_call" | "state_transition";
  label: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  type: "sequence" | "state_change" | "dependency";
  metadata: Record<string, unknown>;
}

export class StatefulExecutionGraphVisualizer {
  private payload: StatefulExecutionPayload;

  constructor(payload: StatefulExecutionPayload) {
    this.payload = payload;
  }

  private extractMessageNodes(messages: Array<Message>): GraphNode[] {
    const nodes: GraphNode[] = [];
    let nodeIdCounter = 0;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let label = "";
      let type: "message" = "message";

      if (message.role === "user") {
        label = `User Input (${i})`;
      } else if (message.role === "assistant") {
        label = `Assistant Response (${i})`;
        type = "message";
      } else if (message.role === "tool") {
        label = `Tool Result (${i})`;
        type = "message";
      }

      nodes.push({
        id: `msg_${nodeIdCounter++}`,
        type: type,
        label: label,
        metadata: { role: message.role, index: i },
        timestamp: 0, // Placeholder, actual time handled by history
      });
    }
    return nodes;
  }

  private extractStateTransitionNodes(history: Array<{
    timestamp: number;
    state: ToolExecutionState;
    tool_result: ToolResultMessage | null;
  }>): GraphNode[] {
    const nodes: GraphNode[] = [];
    let nodeIdCounter = 0;

    for (let i = 0; i < history.length; i++) {
      const historyItem = history[i];
      let label = `State Snapshot ${i}`;
      let type: "state_transition" = "state_transition";

      const violationInfo = historyItem.state.constraintsViolated.length > 0
        ? ` [Violations: ${historyItem.state.constraintsViolated.length}]`
        : "";

      nodes.push({
        id: `state_${nodeIdCounter++}`,
        type: type,
        label: `${label}${violationInfo}`,
        metadata: {
          timestamp: historyItem.timestamp,
          state: historyItem.state,
          toolResult: historyItem.tool_result,
        },
        timestamp: historyItem.timestamp,
      });
    }
    return nodes;
  }

  private createSequenceEdges(nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        fromNodeId: nodes[i].id,
        toNodeId: nodes[i + 1].id,
        type: "sequence",
        metadata: { description: "Sequential flow" },
      });
    }
    return edges;
  }

  public buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const messageNodes = this.extractMessageNodes(this.payload.messages);
    const stateNodes = this.extractStateTransitionNodes(this.payload.history);

    const allNodes: GraphNode[] = [...messageNodes, ...stateNodes];

    // Edges connecting sequential steps (simplification: connect all nodes chronologically)
    const sequenceEdges = this.createSequenceEdges(allNodes);

    // In a real implementation, we would add specific edges:
    // 1. Message -> State (Input triggers state change)
    // 2. State -> Tool Call (State dictates next action)
    // 3. Tool Result -> State (Tool result updates state)

    return {
      nodes: allNodes,
      edges: [...sequenceEdges],
    };
  }

  public visualizeGraph(graphData: { nodes: GraphNode[]; edges: GraphEdge[] }): void {
    // Placeholder for actual visualization framework integration
    console.log("--- Visualization Rendering Simulation ---");
    console.log(`Total Nodes: ${graphData.nodes.length}`);
    console.log(`Total Edges: ${graphData.edges.length}`);

    const stateNodes = graphData.nodes.filter(n => n.type === "state_transition");
    const violationCount = stateNodes.reduce((acc, node) => {
      const state = node.metadata as { state: ToolExecutionState };
      return acc + state.state.constraintsViolated.length;
    }, 0);

    console.log(`Detected ${violationCount} constraint violations across ${stateNodes.length} state checkpoints.`);

    // Simulate rendering logic based on node/edge types
    // e.g., renderGraph(graphData.nodes, graphData.edges, { highlightViolations: true });
  }
}