import {
  DebuggerContext,
  Message,
  ToolUseBlock,
  TextBlock,
  ThinkingBlock,
} from "./debugger-context-types";

export interface GraphNode {
  id: string;
  type: "tool_call" | "user_input" | "assistant_response";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  condition: string;
  weight: number;
}

export interface ToolCallDependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  startNodeId: string;
  endNodeId: string;
}

export interface GraphDebuggerContext extends DebuggerContext {
  graph: ToolCallDependencyGraph;
  currentNodeId: string | null;
  currentEdge: GraphEdge | null;
  history: {
    nodeId: string;
    edge: GraphEdge | null;
    context: Record<string, any>;
  }[];
}

export class ToolCallDependencyGraphDebugger {
  private context: GraphDebuggerContext;

  constructor(graph: ToolCallDependencyGraph, initialContext: DebuggerContext) {
    this.context = {
      ...initialContext,
      graph: graph,
      currentNodeId: graph.startNodeId,
      currentEdge: null,
      history: [],
    } as GraphDebuggerContext;
  }

  public getContext(): GraphDebuggerContext {
    return this.context;
  }

  public stepForward(): {
    nextContext: GraphDebuggerContext;
    action: "ADVANCE" | "FINISHED";
  } {
    const { graph, currentNodeId } = this.context;

    if (!currentNodeId) {
      return { nextContext: this.context, action: "FINISHED" };
    }

    const possibleEdges = graph.edges.filter(
      (edge) => edge.fromNodeId === currentNodeId,
    );

    if (possibleEdges.length === 0) {
      return { nextContext: this.context, action: "FINISHED" };
    }

    // Simple deterministic step: take the first outgoing edge
    const nextEdge = possibleEdges[0];
    const nextNodeId = nextEdge.toNodeId;

    if (nextNodeId === null) {
      return { nextContext: this.context, action: "FINISHED" };
    }

    const nextNode = graph.nodes.get(nextNodeId);
    if (!nextNode) {
      return { nextContext: this.context, action: "FINISHED" };
    }

    const newHistoryEntry = {
      nodeId: nextNodeId,
      edge: nextEdge,
      context: {
        input: nextNode.inputs,
        conditionMet: nextEdge.condition,
      },
    };

    this.context.history = [...this.context.history, newHistoryEntry];
    this.context.currentNodeId = nextNodeId;
    this.context.currentEdge = nextEdge;

    return {
      nextContext: { ...this.context, currentNodeId: nextNodeId, currentEdge: nextEdge, history: [...this.context.history] },
      action: "ADVANCE",
    };
  }

  public stepBackward(): {
    prevContext: GraphDebuggerContext;
    action: "REVERT";
  } {
    if (this.context.history.length === 0) {
      return { prevContext: this.context, action: "REVERT_BLOCKED" };
    }

    const lastStep = this.context.history[this.context.history.length - 1];
    this.context.history.pop();

    const newContext: GraphDebuggerContext = {
      ...this.context,
      currentNodeId: lastStep.nodeId === this.context.currentNodeId ? null : lastStep.nodeId,
      currentEdge: lastStep.edge,
      history: [...this.context.history],
    };

    return { prevContext: { ...this.context, history: [...this.context.history] }, action: "REVERT" };
  }

  public inspectNode(nodeId: string): {
    inspectionContext: GraphDebuggerContext;
    nodeData: GraphNode | undefined;
  } {
    const node = this.context.graph.nodes.get(nodeId);
    if (!node) {
      return { inspectionContext: this.context, nodeData: undefined };
    }

    // Simulate inspection by setting the current node and adding a marker to history
    const inspectionContext: GraphDebuggerContext = {
      ...this.context,
      currentNodeId: nodeId,
      currentEdge: null,
      history: [...this.context.history, {
        nodeId: nodeId,
        edge: null,
        context: { inspection: true, nodeInputs: node.inputs },
      }],
    };

    return { inspectionContext, nodeData: node };
  }
}