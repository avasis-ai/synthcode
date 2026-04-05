import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface NodeState {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  history: Message[];
}

export interface EdgeTraversal {
  sourceNodeId: string;
  targetNodeId: string;
  timestamp: number;
  context: Record<string, unknown>;
}

export interface GraphStateSnapshot {
  nodes: Map<string, NodeState>;
  edges: EdgeTraversal[];
  contextVariables: Record<string, unknown>;
  messageHistory: Message[];
}

export class ToolCallDependencyGraphStateSnapshot {
  private snapshot: GraphStateSnapshot;

  constructor(snapshot: GraphStateSnapshot) {
    this.snapshot = snapshot;
  }

  public getSnapshot(): GraphStateSnapshot {
    return this.snapshot;
  }

  public static createFromContext(
    nodes: Map<string, NodeState>,
    edges: EdgeTraversal[],
    contextVariables: Record<string, unknown>,
    messageHistory: Message[]
  ): ToolCallDependencyGraphStateSnapshot {
    const snapshot: GraphStateSnapshot = {
      nodes: nodes,
      edges: edges,
      contextVariables: contextVariables,
      messageHistory: messageHistory,
    };
    return new ToolCallDependencyGraphStateSnapshot(snapshot);
  }

  public restoreState(
    nodes: Map<string, NodeState>,
    edges: EdgeTraversal[],
    contextVariables: Record<string, unknown>,
    messageHistory: Message[]
  ): void {
    this.snapshot = {
      nodes: nodes,
      edges: edges,
      contextVariables: contextVariables,
      messageHistory: messageHistory,
    };
  }
}