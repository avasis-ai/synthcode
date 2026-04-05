import { EventEmitter } from "events";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface ToolCallDependencyGraph {
  getNodes(): Map<string, any>;
  getEdges(): Map<string, { from: string; to: string }>;
  getNode(nodeId: string): any;
  getSuccessors(nodeId: string): string[];
  getPredecessors(nodeId: string): string[];
}

export interface DebuggerContext {
  graph: ToolCallDependencyGraph;
  history: { nodeId: string; state: any }[];
  currentStateNodeId: string | null;
  executionState: Record<string, any>;
}

export interface DebuggerContextGraph extends DebuggerContext {
  // Additional graph traversal state
  currentTraversalNodeId: string | null;
  pathHistory: string[];
}

export class ToolCallDependencyGraphDebuggerAdvancedV140Debugger extends EventEmitter {
  private context: DebuggerContextGraph;

  constructor(graph: ToolCallDependencyGraph, initialContext: DebuggerContextGraph) {
    super();
    this.context = {
      graph: graph,
      history: initialContext.history,
      currentStateNodeId: initialContext.currentStateNodeId,
      currentTraversalNodeId: initialContext.currentTraversalNodeId,
      pathHistory: initialContext.pathHistory,
      executionState: initialContext.executionState,
    };
  }

  public getContext(): DebuggerContextGraph {
    return this.context;
  }

  public stepForward(): { success: boolean; message: string } {
    const { graph, pathHistory } = this.context;
    if (!this.context.currentTraversalNodeId) {
      return { success: false, message: "Cannot step forward: No current node." };
    }

    const currentNodeId = this.context.currentTraversalNodeId;
    const successors = graph.getSuccessors(currentNodeId);

    if (successors.length === 0) {
      return { success: false, message: `Cannot step forward from node ${currentNodeId}: No successors.` };
    }

    // Simple heuristic: take the first available successor
    const nextNodeId = successors[0];

    this.context.pathHistory.push(nextNodeId);
    this.context.currentTraversalNodeId = nextNodeId;

    this.emit("stepForward", { nodeId: nextNodeId, path: [...pathHistory, nextNodeId] });
    return { success: true, message: `Stepped forward to node ${nextNodeId}.` };
  }

  public stepBackward(): { success: boolean; message: string } {
    const { pathHistory } = this.context;
    if (pathHistory.length <= 1) {
      return { success: false, message: "Cannot step backward: Already at the start." };
    }

    // Pop the last node from the path history
    this.context.pathHistory.pop();
    this.context.currentTraversalNodeId = pathHistory[pathHistory.length - 1] || null;

    this.emit("stepBackward", { nodeId: this.context.currentTraversalNodeId!, path: [...this.context.pathHistory, this.context.currentTraversalNodeId!] });
    return { success: true, message: `Stepped backward to node ${this.context.currentTraversalNodeId!}.` };
  }

  public inspectNode(nodeId: string): { success: boolean; node: any; message: string } {
    const graph = this.context.graph;
    if (!graph.getNodes().has(nodeId)) {
      return { success: false, node: null, message: `Node ${nodeId} not found in the graph.` };
    }

    const node = graph.getNode(nodeId);
    this.context.currentTraversalNodeId = nodeId;

    this.emit("inspectNode", { nodeId: nodeId, nodeData: node });
    return { success: true, node: node, message: `Successfully inspected node ${nodeId}.` };
  }

  public resetTraversal(): { success: boolean; message: string } {
    this.context.currentTraversalNodeId = null;
    this.context.pathHistory = [];
    this.emit("resetTraversal");
    return { success: true, message: "Traversal context reset." };
  }
}