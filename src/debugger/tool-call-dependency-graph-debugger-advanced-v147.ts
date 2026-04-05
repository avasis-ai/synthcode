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

export interface DebuggerContext {
  graph: GraphNode[];
  currentNodeId: string | null;
  history: { nodeId: string; step: number }[];
  stepCounter: number;
  isPaused: boolean;
}

export interface GraphNode {
  id: string;
  type: "tool_call" | "message_generation" | "tool_result";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  metadata: Record<string, unknown>;
}

export class ToolCallDebugger {
  private context: DebuggerContext;

  constructor(graph: GraphNode[]) {
    this.context = {
      graph: graph,
      currentNodeId: graph.length > 0 ? graph[0].id : null,
      history: [],
      stepCounter: 0,
      isPaused: false,
    };
  }

  public getContext(): DebuggerContext {
    return this.context;
  }

  public stepForward(): { success: boolean; message: string } {
    if (this.context.isPaused) {
      return { success: false, message: "Debugger is paused. Resume execution first." };
    }

    const nodes = this.context.graph;
    if (nodes.length === 0) {
      return { success: false, message: "Execution graph is empty." };
    }

    const currentIndex = this.context.history.length;
    if (currentIndex >= nodes.length - 1) {
      return { success: false, message: "Reached the end of the execution graph." };
    }

    const nextNode = nodes[currentIndex + 1];
    this.context.currentNodeId = nextNode.id;
    this.context.history.push({ nodeId: nextNode.id, step: this.context.stepCounter + 1 });
    this.context.stepCounter++;

    return { success: true, message: `Stepped forward to node: ${nextNode.id} (${nextNode.type}).` };
  }

  public stepBackward(): { success: boolean; message: string } {
    if (this.context.history.length === 0) {
      return { success: false, message: "Cannot step backward; at the start of the graph." };
    }

    // Pop the current node from history
    this.context.history.pop();
    this.context.stepCounter--;

    // Determine the previous node's ID
    const previousStep = this.context.history.length - 1;
    if (previousStep < 0) {
      this.context.currentNodeId = null;
      return { success: true, message: "Stepped back to the initial state." };
    }

    const previousNode = this.context.graph.find(node => node.id === this.context.history[previousStep].nodeId);
    if (previousNode) {
      this.context.currentNodeId = previousNode.id;
      return { success: true, message: `Stepped back to node: ${previousNode.id} (${previousNode.type}).` };
    }

    return { success: false, message: "Error finding previous node state." };
  }

  public inspectNode(nodeId: string): { success: boolean; node: GraphNode | null; message: string } {
    const node = this.context.graph.find(n => n.id === nodeId);
    if (!node) {
      return { success: false, node: null, message: `Node with ID ${nodeId} not found in the graph.` };
    }
    return { success: true, node: node, message: `Successfully inspected node: ${nodeId}.` };
  }

  public pauseExecution() {
    this.context.isPaused = true;
    return { success: true, message: "Execution paused. Use debugger methods to inspect state." };
  }

  public resumeExecution(): { success: boolean; message: string } {
    this.context.isPaused = false;
    return { success: true, message: "Execution resumed." };
  }
}