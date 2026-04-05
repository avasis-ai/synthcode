import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GraphNodeId = string;
export type GraphEdgeId = string;

export interface NodeMetadata {
  nodeId: GraphNodeId;
  type: "user" | "assistant" | "tool_result" | "internal";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  executionResult: unknown;
  timestamp: number;
}

export interface EdgeMetadata {
  edgeId: GraphEdgeId;
  fromNodeId: GraphNodeId;
  toNodeId: GraphNodeId;
  dependencyType: "input" | "output" | "control_flow";
  payload: unknown;
}

export interface DebugGraphState {
  nodes: Map<GraphNodeId, NodeMetadata>;
  edges: Map<GraphEdgeId, EdgeMetadata>;
  executionHistory: Array<{ nodeId: GraphNodeId; timestamp: number }>;
}

export class ToolCallDependencyGraphDebuggerAdvancedV141 {
  private state: DebugGraphState;

  constructor() {
    this.state = {
      nodes: new Map<GraphNodeId, NodeMetadata>(),
      edges: new Map<GraphEdgeId, EdgeMetadata>(),
      executionHistory: [],
    };
  }

  private recordNode(nodeId: GraphNodeId, metadata: Partial<NodeMetadata>): void {
    const newNode: NodeMetadata = {
      nodeId: nodeId,
      type: "internal", // Simplified type for this context
      inputs: {},
      outputs: {},
      executionResult: undefined,
      timestamp: Date.now(),
    };

    Object.assign(newNode, metadata);
    this.state.nodes.set(nodeId, newNode);
    this.state.executionHistory.push({ nodeId: nodeId, timestamp: Date.now() });
  }

  private recordEdge(edgeId: GraphEdgeId, fromId: GraphNodeId, toId: GraphNodeId, dependencyType: "input" | "output" | "control_flow", payload: unknown): void {
    const newEdge: EdgeMetadata = {
      edgeId: edgeId,
      fromNodeId: fromId,
      toNodeId: toId,
      dependencyType: dependencyType,
      payload: payload,
    };
    this.state.edges.set(edgeId, newEdge);
  }

  public captureNodeState(nodeId: GraphNodeId, inputs: Record<string, unknown>, outputs: Record<string, unknown>, result: unknown): void {
    const metadata: Partial<NodeMetadata> = {
      inputs: inputs,
      outputs: outputs,
      executionResult: result,
    };
    this.recordNode(nodeId, metadata);
  }

  public captureEdgeDependency(edgeId: GraphEdgeId, fromId: GraphNodeId, toId: GraphNodeId, dependencyType: "input" | "output" | "control_flow", payload: unknown): void {
    this.recordEdge(edgeId, fromId, toId, dependencyType, payload);
  }

  public processMessage(message: Message, nodeId: GraphNodeId): void {
    let nodeInputs: Record<string, unknown> = {};
    let nodeOutputs: Record<string, unknown> = {};
    let result: unknown = message;

    if (message.role === "user") {
      nodeInputs["user_input"] = message.content;
      nodeOutputs["user_message"] = message.content;
    } else if (message.role === "assistant") {
      nodeInputs["assistant_response"] = message.content;
      nodeOutputs["assistant_message"] = message.content;
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      nodeInputs["tool_result"] = toolResult;
      nodeOutputs["tool_result"] = toolResult;
    }

    this.captureNodeState(nodeId, nodeInputs, nodeOutputs, result);
  }

  public getStructuredState(): { nodes: Record<GraphNodeId, NodeMetadata>; edges: Record<GraphEdgeId, EdgeMetadata>; history: Array<{ nodeId: GraphNodeId; timestamp: number }> } {
    return {
      nodes: Object.fromEntries(this.state.nodes),
      edges: Object.fromEntries(this.state.edges),
      history: this.state.executionHistory,
    };
  }
}