import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synth-code-types";

type GraphNodeId = string;

interface GraphEdge {
  from: GraphNodeId;
  to: GraphNodeId;
  dependencyType: "CALL" | "RESPONSE" | "INPUT";
  context: Record<string, unknown>;
}

interface GraphNode {
  id: GraphNodeId;
  type: "USER_INPUT" | "ASSISTANT_THOUGHT" | "TOOL_CALL" | "TOOL_RESULT";
  data: Record<string, unknown>;
  dependencies: GraphEdge[];
}

interface DependencyGraph {
  nodes: Map<GraphNodeId, GraphNode>;
  edges: GraphEdge[];
}

interface DebuggerContext {
  graph: DependencyGraph;
  history: {
    nodeId: GraphNodeId;
    step: "ENTER" | "EXIT";
    state: Record<string, unknown>;
  }[];
  currentNodeId: GraphNodeId | null;
  isFinished: boolean;
}

class DebuggerEngine {
  private context: DebuggerContext;

  constructor(graph: DependencyGraph, initialContext: DebuggerContext) {
    this.context = initialContext;
  }

  public stepForward(): { nextContext: DebuggerContext; success: boolean; message: string } {
    if (this.context.isFinished) {
      return { nextContext: this.context, success: false, message: "Execution finished." };
    }

    const currentNodeId = this.context.currentNodeId;
    if (!currentNodeId) {
      return { nextContext: this.context, success: false, message: "No current node to step from." };
    }

    const currentNode = this.context.graph.nodes.get(currentNodeId)!;
    const nextEdge = currentNode.dependencies.find(
      (edge) => edge.from === currentNodeId && edge.to !== undefined
    );

    if (!nextEdge) {
      return { nextContext: this.context, success: false, message: `No outgoing edges found from node ${currentNodeId}.` };
    }

    const nextNodeId = nextEdge.to as GraphNodeId;
    const nextNode = this.context.graph.nodes.get(nextNodeId)!;

    // Simulate state transition logic
    const newHistoryEntry = {
      nodeId: nextNodeId,
      step: "ENTER",
      state: {
        edgeContext: nextEdge.context,
        previousNodeId: currentNodeId,
      },
    };

    const newContext: DebuggerContext = {
      graph: this.context.graph,
      history: [...this.context.history, newHistoryEntry],
      currentNodeId: nextNodeId,
      isFinished: false,
    };

    return {
      nextContext: newContext,
      success: true,
      message: `Stepped from ${currentNodeId} to ${nextNodeId} via ${nextEdge.dependencyType}.`,
    };
  }

  public stepBackward(): { nextContext: DebuggerContext; success: boolean; message: string } {
    if (this.context.history.length === 0) {
      return { nextContext: this.context, success: false, message: "Cannot step backward, history is empty." };
    }

    const history = this.context.history;
    const lastEntry = history[history.length - 1];

    if (lastEntry.step === "ENTER") {
      // Simulate exiting the current node's context
      const newHistoryEntry = {
        nodeId: lastEntry.nodeId,
        step: "EXIT",
        state: {
          exitReason: "Manual step back",
        },
      };

      const newContext: DebuggerContext = {
        graph: this.context.graph,
        history: [...history.slice(0, history.length - 1), newHistoryEntry],
        currentNodeId: history.length > 1 ? history[history.length - 2].nodeId : null,
        isFinished: false,
      };

      return {
        nextContext: newContext,
        success: true,
        message: `Stepped back from ${lastEntry.nodeId}.`,
      };
    }

    return { nextContext: this.context, success: false, message: "Cannot step backward from an EXIT state." };
  }

  public inspectNode(nodeId: GraphNodeId): { success: boolean; details: GraphNode | null; message: string } {
    const node = this.context.graph.nodes.get(nodeId);
    if (!node) {
      return { success: false, details: null, message: `Node ${nodeId} not found in the graph.` };
    }
    return { success: true, details: node, message: `Successfully inspected node ${nodeId}.` };
  }
}

export class ToolCallDependencyGraphDebuggerAdvancedV143 {
  private engine: DebuggerEngine;

  constructor(graph: DependencyGraph) {
    const initialContext: DebuggerContext = {
      graph: graph,
      history: [],
      currentNodeId: null,
      isFinished: false,
    };
    this.engine = new DebuggerEngine(graph, initialContext);
  }

  public stepForward(): { nextContext: DebuggerContext; success: boolean; message: string } {
    return this.engine.stepForward();
  }

  public stepBackward(): { nextContext: DebuggerContext; success: boolean; message: string } {
    return this.engine.stepBackward();
  }

  public inspectNode(nodeId: GraphNodeId): { success: boolean; details: GraphNode | null; message: string } {
    return this.engine.inspectNode(nodeId);
  }

  public getCurrentContext(): DebuggerContext {
    // Return a copy to prevent external mutation
    return {
      graph: this.engine['context'].graph,
      history: [...this.engine['context'].history],
      currentNodeId: this.engine['context'].currentNodeId,
      isFinished: this.engine['context'].isFinished,
    };
  }
}