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

type GraphNodeId = string;

interface GraphEdge {
  from: GraphNodeId;
  to: GraphNodeId;
  type: "CALL" | "DEPENDS_ON" | "FLOW_CONTROL";
  metadata: Record<string, unknown>;
}

interface GraphNode {
  id: GraphNodeId;
  type: "USER_INPUT" | "ASSISTANT_THOUGHT" | "TOOL_CALL" | "TOOL_RESULT";
  metadata: Record<string, unknown>;
  // Represents the content associated with the node (e.g., tool use details, text)
  content: ContentBlock | null;
}

interface DependencyGraph {
  nodes: Map<GraphNodeId, GraphNode>;
  edges: Set<GraphEdge>;
}

type DebugState = {
  graph: DependencyGraph;
  history: {
    step: number;
    state: DependencyGraph;
    context: Record<string, unknown>;
  }[];
  currentStepIndex: number;
}

export class ToolCallDependencyGraphDebugger {
  private state: DebugState;

  constructor(initialGraph: DependencyGraph) {
    this.state = {
      graph: initialGraph,
      history: [],
      currentStepIndex: -1,
    };
    this.recordState(initialGraph, "Initialization");
  }

  private recordState(graph: DependencyGraph, context: string): void {
    const newState: DebugState = {
      graph: graph,
      history: [...this.state.history, {
        step: this.state.history.length + 1,
        state: graph,
        context: { ...this.state.context, last_context: context },
      }],
      currentStepIndex: this.state.history.length,
    };
    this.state = newState;
  }

  public stepForward(): { success: boolean; message: string } {
    if (this.state.currentStepIndex < this.state.history.length - 1) {
      this.state.currentStepIndex++;
      return { success: true, message: `Stepped to step ${this.state.currentStepIndex + 1}` };
    }
    return { success: false, message: "Cannot step forward, reached the end of recorded history." };
  }

  public stepBackward(): { success: boolean; message: string } {
    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--;
      return { success: true, message: `Stepped back to step ${this.state.currentStepIndex}` };
    }
    return { success: false, message: "Cannot step backward, already at the initial state." };
  }

  public getCurrentGraph(): DependencyGraph {
    return this.state.history[this.state.currentStepIndex].state;
  }

  public getCurrentContext(): Record<string, unknown> {
    return this.state.history[this.state.currentStepIndex].context;
  }

  public getStepDetails(): {
    step: number;
    graph: DependencyGraph;
    context: Record<string, unknown>;
  } {
    return {
      step: this.state.currentStepIndex + 1,
      graph: this.state.history[this.state.currentStepIndex].state,
      context: this.state.history[this.state.currentStepIndex].context,
    };
  }

  public inspectNode(nodeId: GraphNodeId): { exists: boolean; node: GraphNode | null } {
    const graph = this.getCurrentGraph();
    const node = graph.nodes.get(nodeId);
    return { exists: !!node, node: node };
  }

  public inspectEdge(fromId: GraphNodeId, toId: GraphNodeId): { exists: boolean; edge: GraphEdge | null } {
    const graph = this.getCurrentGraph();
    let foundEdge: GraphEdge | null = null;
    for (const edge of graph.edges) {
      if (edge.from === fromId && edge.to === toId) {
        foundEdge = edge;
        break;
      }
    }
    return { exists: !!foundEdge, edge: foundEdge };
  }

  public getVariableState(variableName: string): unknown {
    const context = this.getCurrentContext();
    return context[variableName] !== undefined ? context[variableName] : undefined;
  }
}