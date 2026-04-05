import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type NodeState = {
  nodeId: string;
  message: Message;
  status: "pending" | "running" | "completed" | "failed";
  toolCalls: ToolUseBlock[];
  dependencies: {
    sourceId: string;
    targetId: string;
    edgeType: "input" | "output" | "dependency";
  }[];
};

export type EdgeTraversal = {
  fromNodeId: string;
  toNodeId: string;
  timestamp: number;
  action: "traverse" | "resolve" | "fail";
  details: Record<string, unknown>;
};

export interface GraphContextSnapshot {
  timestamp: number;
  nodes: Record<string, NodeState>;
  edges: EdgeTraversal[];
  history: {
    type: "node_update" | "edge_traverse" | "context_snapshot";
    data: Record<string, unknown>;
  }[];
}

export class ToolCallDependencyGraphContext {
  private context: GraphContextSnapshot;

  constructor(initialNodes: Record<string, NodeState> = {}, initialEdges: EdgeTraversal[] = []) {
    this.context = {
      timestamp: Date.now(),
      nodes: initialNodes,
      edges: initialEdges,
      history: [],
    };
  }

  public getSnapshot(): GraphContextSnapshot {
    return { ...this.context };
  }

  public updateNodeState(nodeId: string, updates: Partial<NodeState>): void {
    if (!this.context.nodes[nodeId]) {
      throw new Error(`Node with ID ${nodeId} not found in context.`);
    }
    const oldState = this.context.nodes[nodeId];
    this.context.nodes[nodeId] = {
      ...oldState,
      ...updates,
      nodeId: nodeId,
    };

    this.context.history.push({
      type: "node_update",
      data: {
        nodeId,
        oldState,
        newState: this.context.nodes[nodeId],
      },
    });
  }

  public recordEdgeTraversal(fromNodeId: string, toNodeId: string, action: "traverse" | "resolve" | "fail", details: Record<string, unknown>): void {
    const traversal: EdgeTraversal = {
      fromNodeId,
      toNodeId,
      timestamp: Date.now(),
      action,
      details,
    };
    this.context.edges.push(traversal);

    this.context.history.push({
      type: "edge_traverse",
      data: {
        fromNodeId,
        toNodeId,
        action,
        details,
      },
    });
  }

  public snapshotContext(reason: string): void {
    this.context.history.push({
      type: "context_snapshot",
      data: { reason, snapshotTimestamp: Date.now() },
    });
  }

  public serialize(): string {
    return JSON.stringify(this.context);
  }

  public static deserialize(jsonString: string): ToolCallDependencyGraphContext {
    const context: GraphContextSnapshot = JSON.parse(jsonString);
    const instance = new ToolCallDependencyGraphContext();
    instance['context'] = context; // Type assertion for internal state setting
    return instance;
  }
}