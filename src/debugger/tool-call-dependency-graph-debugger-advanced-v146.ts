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

export type GraphPath = string[];

interface ToolCallDependencyGraph {
  nodes: Map<string, any>;
  edges: Map<string, { source: string; target: string; weight: number }>;
  getSuccessors(nodeId: string): string[];
  getPredecessors(nodeId: string): string[];
}

interface DebuggerContext {
  graph: ToolCallDependencyGraph;
  history: { nodeId: string; state: any }[];
  currentNodeId: string | null;
  initialInput: Message;
}

export class DebuggerEngine {
  private context: DebuggerContext;

  constructor(graph: ToolCallDependencyGraph, initialContext: DebuggerContext) {
    this.context = initialContext;
  }

  public stepForward(): { success: boolean; nextContext: DebuggerContext; message: string } {
    const { currentNodeId } = this.context;
    if (!currentNodeId) {
      return { success: false, nextContext: this.context, message: "Cannot step forward: No current node." };
    }

    const successors = this.context.graph.getSuccessors(currentNodeId);
    if (successors.length === 0) {
      return { success: false, nextContext: this.context, message: `Reached end node: ${currentNodeId}. No further steps.` };
    }

    // Simple deterministic step: take the first available successor
    const nextNodeId = successors[0];

    const nextState = { nodeId: nextNodeId, state: {} }; // Placeholder for actual state update
    const newHistory = [...this.context.history, { nodeId: nextNodeId, state: {} }];
    const newContext: DebuggerContext = {
      graph: this.context.graph,
      history: newHistory,
      currentNodeId: nextNodeId,
      initialInput: this.context.initialInput,
    };

    return {
      success: true,
      nextContext: newContext,
      message: `Stepped from ${currentNodeId} to ${nextNodeId}.`,
    };
  }

  public stepBackward(): { success: boolean; nextContext: DebuggerContext; message: string } {
    const { history, currentNodeId } = this.context;
    if (history.length === 0 || !currentNodeId) {
      return { success: false, nextContext: this.context, message: "Cannot step backward: History is empty." };
    }

    // Rollback to the previous node in history
    const previousStep = history[history.length - 2];
    if (!previousStep) {
        return { success: false, nextContext: this.context, message: "Cannot step backward: Only the initial state exists." };
    }

    const newContext: DebuggerContext = {
      graph: this.context.graph,
      history: history.slice(0, history.length - 1),
      currentNodeId: previousStep.nodeId,
      initialInput: this.context.initialInput,
    };

    return {
      success: true,
      nextContext: newContext,
      message: `Stepped back from ${currentNodeId} to ${previousStep.nodeId}.`,
    };
  }

  public simulatePath(path: GraphPath): { success: boolean; nextContext: DebuggerContext; message: string } {
    if (path.length === 0) {
      return { success: false, nextContext: this.context, message: "Simulation path cannot be empty." };
    }

    let currentContext: DebuggerContext = {
      graph: this.context.graph,
      history: [...this.context.history],
      currentNodeId: this.context.currentNodeId,
      initialInput: this.context.initialInput,
    };

    let lastNodeId: string | null = this.context.currentNodeId;

    for (let i = 0; i < path.length; i++) {
      const targetNodeId = path[i];

      if (lastNodeId && !this.context.graph.edges.has(`${lastNodeId}->${targetNodeId}`)) {
        return { success: false, nextContext: this.context, message: `Invalid transition: No edge found from ${lastNodeId} to ${targetNodeId}.` };
      }

      // Simulate state update for the path traversal
      currentContext = {
        graph: this.context.graph,
        history: [...currentContext.history, { nodeId: targetNodeId, state: {} }],
        currentNodeId: targetNodeId,
        initialInput: this.context.initialInput,
      };
      lastNodeId = targetNodeId;
    }

    return {
      success: true,
      nextContext: currentContext,
      message: `Successfully simulated path: ${path.join(" -> ")}.`,
    };
  }
}