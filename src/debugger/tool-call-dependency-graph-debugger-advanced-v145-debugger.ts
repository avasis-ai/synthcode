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

export interface DebuggerContext extends Map<string, any> {}

export interface GraphNode {
  id: string;
  type: "message" | "tool_call" | "tool_result";
  data: any;
  dependencies: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface ToolCallDependencyGraphDebugger {
  graph: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  context: DebuggerContext;

  stepForward(): { success: boolean; currentContext: DebuggerContext; message: string };
  stepBackward(): { success: boolean; currentContext: DebuggerContext; message: string };
  inspectNode(nodeId: string): { success: boolean; node: GraphNode | null; message: string };
  resetDebugger(): DebuggerContext;
}

export class ToolCallDependencyGraphDebugger {
  private graph: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge>;
  private context: DebuggerContext;

  constructor(graph: Map<string, GraphNode>, edges: Map<string, GraphEdge>, initialContext: DebuggerContext) {
    this.graph = graph;
    this.edges = edges;
    this.context = initialContext;
  }

  public stepForward(): { success: boolean; currentContext: DebuggerContext; message: string } {
    const currentNodeId = this.context.get("currentNodeId") as string;
    if (!currentNodeId) {
      return { success: false, currentContext: this.context, message: "Cannot step forward: No current node set." };
    }

    const nextEdge = this.findNextEdge(currentNodeId);
    if (!nextEdge) {
      return { success: false, currentContext: this.context, message: `Cannot step forward from node ${currentNodeId}: No outgoing edges found.` };
    }

    const nextNodeId = nextEdge.to;
    this.context.set("currentNodeId", nextNodeId);
    this.context.set("lastEdge", JSON.stringify(nextEdge));

    return {
      success: true,
      currentContext: this.context,
      message: `Stepped forward from ${currentNodeId} to ${nextNodeId} via edge weight ${nextEdge.weight}.`,
    };
  }

  public stepBackward(): { success: boolean; currentContext: DebuggerContext; message: string } {
    const lastEdgeStr = this.context.get("lastEdge") as string;
    if (!lastEdgeStr) {
      return { success: false, currentContext: this.context, message: "Cannot step backward: No previous edge recorded." };
    }

    const lastEdge: GraphEdge = JSON.parse(lastEdgeStr);
    const previousNodeId = lastEdge.from;

    this.context.set("currentNodeId", previousNodeId);
    this.context.delete("lastEdge");

    return {
      success: true,
      currentContext: this.context,
      message: `Stepped backward from ${lastEdge.to} to ${previousNodeId}.`,
    };
  }

  public inspectNode(nodeId: string): { success: boolean; node: GraphNode | null; message: string } {
    const node = this.graph.get(nodeId);
    if (!node) {
      return { success: false, node: null, message: `Node with ID ${nodeId} not found in the graph.` };
    }

    this.context.set("currentNodeId", nodeId);
    return { success: true, node: node, message: `Successfully inspected node ${nodeId}.` };
  }

  public resetDebugger(): DebuggerContext {
    this.context.clear();
    this.context.set("currentNodeId", "");
    this.context.set("lastEdge", "");
    return this.context;
  }

  private findNextEdge(fromNodeId: string): GraphEdge | null {
    const outgoingEdges = Array.from(this.edges.values()).filter(edge => edge.from === fromNodeId);
    if (outgoingEdges.length === 0) {
      return null;
    }
    // Simple heuristic: pick the edge with the highest weight or the first one if weights are equal/missing
    return outgoingEdges.reduce((best: GraphEdge, current: GraphEdge) => {
      return (current.weight > best.weight) ? current : best;
    }, outgoingEdges[0]);
  }
}

export class DebuggerEngine {
  public static initializeDebugger(
    graph: Map<string, GraphNode>,
    edges: Map<string, GraphEdge>,
  ): ToolCallDependencyGraphDebugger {
    const initialContext: DebuggerContext = new Map<string, any>();
    initialContext.set("currentNodeId", "");
    initialContext.set("lastEdge", "");
    return new ToolCallDependencyGraphDebugger(graph, edges, initialContext);
  }
}