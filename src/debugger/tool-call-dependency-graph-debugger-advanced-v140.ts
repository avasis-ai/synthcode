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

interface GraphNode {
  id: string;
  type: "tool_call" | "reasoning";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export class ToolCallDependencyGraph {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge[]>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(fromId: string, toId: string, weight: number = 1): void {
    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, []);
    }
    this.edges.get(fromId)!.push({ from: fromId, to: toId, weight });
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdgesFrom(nodeId: string): GraphEdge[] {
    return this.edges.get(nodeId) || [];
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }
}

interface DebuggerContext {
  graph: ToolCallDependencyGraph;
  history: {
    nodeId: string;
    state: Record<string, unknown>;
    message: Message;
  }[];
  currentNodeId: string | null;
  stepIndex: number;
}

export class DebuggerEngine {
  private context: DebuggerContext;

  constructor(graph: ToolCallDependencyGraph, initialContext: DebuggerContext) {
    this.context = initialContext;
  }

  private validateStep(stepIndex: number): boolean {
    const history = this.context.history;
    return stepIndex >= 0 && stepIndex < history.length;
  }

  public stepForward(): { success: boolean; context: DebuggerContext; } {
    const nextIndex = this.context.stepIndex + 1;
    if (this.validateStep(nextIndex)) {
      this.context.stepIndex = nextIndex;
      this.context.currentNodeId = this.context.history[nextIndex].nodeId;
      return { success: true, context: this.context };
    }
    return { success: false, context: this.context };
  }

  public stepBackward(): { success: boolean; context: DebuggerContext; } {
    const prevIndex = this.context.stepIndex - 1;
    if (this.validateStep(prevIndex)) {
      this.context.stepIndex = prevIndex;
      this.context.currentNodeId = this.context.history[prevIndex].nodeId;
      return { success: true, context: this.context };
    }
    return { success: false, context: this.context };
  }

  public inspectState(): { success: boolean; state: Record<string, unknown>; } {
    if (!this.context.currentNodeId) {
      return { success: false, state: { error: "No current node in context." } };
    }

    const node = this.context.graph.getNode(this.context.currentNodeId);
    if (!node) {
      return { success: false, state: { error: `Node ${this.context.currentNodeId} not found in graph.` } };
    }

    const state: Record<string, unknown> = {
      nodeId: this.context.currentNodeId,
      nodeData: node,
      variableScope: {
        // Simulate variable scope inspection based on node type
        [node.type === "tool_call" ? "toolInputs" : "reasoningContext"]: node.input,
      },
      historySnapshot: this.context.history[this.context.stepIndex],
    };

    return { success: true, state };
  }
}

export const initializeDebugger = (
  graph: ToolCallDependencyGraph,
  initialHistory: {
    nodeId: string;
    state: Record<string, unknown>;
    message: Message;
  }[]
): {
  engine: DebuggerEngine;
  context: DebuggerContext;
} => {
  const initialContext: DebuggerContext = {
    graph: graph,
    history: initialHistory,
    currentNodeId: initialHistory.length > 0 ? initialHistory[initialHistory.length - 1].nodeId : null,
    stepIndex: initialHistory.length - 1,
  };
  const engine = new DebuggerEngine(graph, initialContext);
  return { engine, context: initialContext };
};