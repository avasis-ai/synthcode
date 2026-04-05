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

type ToolCallGraphNode = {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies: string[];
};

type DebuggerState = {
  currentNodeId: string | null;
  graph: Map<string, ToolCallGraphNode>;
  history: Message[];
  currentStep: "pre_call" | "post_call" | "error" | "idle";
  context: Record<string, unknown>;
};

export class ToolCallDependencyGraphDebuggerAdvanced {
  private state: DebuggerState;

  constructor(initialGraph: Map<string, ToolCallGraphNode>, initialHistory: Message[]) {
    this.state = {
      currentNodeId: null,
      graph: initialGraph,
      history: initialHistory,
      currentStep: "idle",
      context: {},
    };
  }

  private logState(message: string): void {
    console.log("--- Debugger State Update ---");
    console.log(`Step: ${this.state.currentStep}`);
    console.log(`Current Node ID: ${this.state.currentNodeId || 'None'}`);
    console.log("Graph:", Array.from(this.state.graph.values()).map(node => ({
      id: node.id,
      status: node.status,
      dependencies: node.dependencies,
    })));
    console.log("Context:", this.state.context);
    console.log("----------------------------\n");
  }

  public initialize(initialGraph: Map<string, ToolCallGraphNode>, initialHistory: Message[]): void {
    this.state = {
      currentNodeId: null,
      graph: initialGraph,
      history: initialHistory,
      currentStep: "idle",
      context: {},
    };
    this.logState("Debugger Initialized");
  }

  public setContext(key: string, value: unknown): void {
    this.state.context[key] = value;
    this.logState(`Context updated: ${key}`);
  }

  public advanceToPreCall(nodeId: string, input: Record<string, unknown>): void {
    if (!this.state.graph.has(nodeId)) {
      throw new Error(`Node ID ${nodeId} not found in graph.`);
    }
    this.state.currentNodeId = nodeId;
    this.state.currentStep = "pre_call";
    const node = this.state.graph.get(nodeId)!;
    const updatedNode = { ...node, status: "pending", input: input };
    this.state.graph.set(nodeId, updatedNode);
    this.logState(`Pre-Call Step for Node ${nodeId}`);
  }

  public advanceToPostCall(nodeId: string, output: Record<string, unknown>): void {
    if (this.state.currentNodeId !== nodeId) {
      throw new Error(`Cannot advance post-call for ${nodeId}. Expected current node ${this.state.currentNodeId}`);
    }
    this.state.currentStep = "post_call";
    const node = this.state.graph.get(nodeId)!;
    const updatedNode = { ...node, status: "completed", output: output };
    this.state.graph.set(nodeId, updatedNode);
    this.logState(`Post-Call Step for Node ${nodeId}`);
  }

  public advanceOnError(nodeId: string, error: Error): void {
    if (this.state.currentNodeId !== nodeId) {
      throw new Error(`Cannot advance error for ${nodeId}. Expected current node ${this.state.currentNodeId}`);
    }
    this.state.currentStep = "error";
    const node = this.state.graph.get(nodeId)!;
    const updatedNode = { ...node, status: "failed" };
    this.state.graph.set(nodeId, updatedNode);
    this.logState(`Error Step for Node ${nodeId}`);
  }

  public getCurrentExecutionStack(): string {
    const nodes = Array.from(this.state.graph.values()).filter(node =>
      node.status === "pending" || node.status === "running"
    );
    return nodes.map(node => `[${node.id}] ${node.name} (${node.status})`).join(" -> ");
  }

  public getCurrentDependencyPath(): string {
    const currentNode = this.state.graph.get(this.state.currentNodeId);
    if (!currentNode || !currentNode.dependencies.length) {
      return "No active dependency path.";
    }
    return `Dependencies: ${currentNode.dependencies.join(" -> ")}`;
  }

  public getDebuggerSnapshot(): {
    state: DebuggerState;
    stack: string;
    path: string;
  } {
    return {
      state: { ...this.state },
      stack: this.getCurrentExecutionStack(),
      path: this.getCurrentDependencyPath(),
    };
  }
}