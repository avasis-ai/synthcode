import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synthcode-types";

type NodeId = string;
type EdgeId = string;

interface GraphNode {
  id: NodeId;
  type: "user" | "assistant" | "tool_call" | "thinking";
  input: any;
  output: any | null;
  state: Record<string, any>;
}

interface GraphEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  dependencyType: "calls" | "follows";
  context: Record<string, any>;
}

interface DependencyGraph {
  nodes: Map<NodeId, GraphNode>;
  edges: Map<EdgeId, GraphEdge>;
  executionOrder: NodeId[];
}

export class ToolCallDependencyGraphDebuggerAdvancedV137Enhanced {
  private graph: DependencyGraph;
  private history: {
    state: DependencyGraph;
    step: "forward" | "backward";
  }[] = [];

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      executionOrder: [],
    };
  }

  private initializeGraph(initialNodes: GraphNode[], initialEdges: GraphEdge[]): void {
    this.graph.nodes = new Map(initialNodes.map(node => [node.id, node]));
    this.graph.edges = new Map(initialEdges.map(edge => [edge.id, edge]));
    this.graph.executionOrder = initialNodes.map(node => node.id);
  }

  public loadGraph(nodes: GraphNode[], edges: GraphEdge[]): void {
    this.graph.nodes = new Map(nodes.map(node => [node.id, node]));
    this.graph.edges = new Map(edges.map(edge => [edge.id, edge]));
    this.graph.executionOrder = nodes.map(node => node.id);
    this.history = [];
  }

  private saveState(): void {
    const currentState: {
      state: DependencyGraph;
      step: "forward" | "backward";
    } = {
      state: {
        nodes: new Map(this.graph.nodes),
        edges: new Map(this.graph.edges),
        executionOrder: [...this.graph.executionOrder],
      },
      step: "forward",
    };
    this.history.push(currentState);
  }

  public stepForward(nodeId: NodeId, simulatedOutput: any): boolean {
    if (this.history.length === 0) {
      console.warn("Cannot step forward: No initial state loaded.");
      return false;
    }

    const currentNode = this.graph.nodes.get(nodeId);
    if (!currentNode) {
      console.error(`Node ${nodeId} not found for stepping.`);
      return false;
    }

    const updatedNodes = new Map(this.graph.nodes);
    const updatedNode = {
      ...currentNode,
      output: simulatedOutput,
      state: { ...currentNode.state, ...simulatedOutput.state || {} },
    };
    updatedNodes.set(nodeId, updatedNode);

    this.graph.nodes = updatedNodes;
    this.saveState();
    return true;
  }

  public stepBackward(): boolean {
    if (this.history.length === 0) {
      console.warn("Cannot step backward: No history recorded.");
      return false;
    }

    this.history.pop();
    const lastState = this.history.length > 0 ? this.history[this.history.length - 1] : null;

    if (lastState) {
      this.graph.nodes = new Map(lastState.state.nodes);
      this.graph.edges = new Map(lastState.state.edges);
      this.graph.executionOrder = [...lastState.state.executionOrder];
      return true;
    }
    return false;
  }

  public inspectState(): void {
    console.log("--- Current Debugger State ---");
    console.log("Execution Order:", this.graph.executionOrder);
    console.log("\n--- Nodes ---");
    this.graph.nodes.forEach(node => {
      console.log(`[${node.id}] Type: ${node.type}`);
      console.log(`  Output:`, node.output ? JSON.stringify(node.output, null, 2) : "N/A");
      console.log(`  State:`, node.state);
    });
    console.log("\n--- Edges ---");
    this.graph.edges.forEach(edge => {
      console.log(`[${edge.id}] ${edge.source} -> ${edge.target} (${edge.dependencyType})`);
      console.log(`  Context:`, edge.context);
    });
    console.log("-----------------------------");
  }

  public getGraphSnapshot(): {
    nodes: GraphNode[];
    edges: GraphEdge[];
    order: NodeId[];
  } {
    return {
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values()),
      order: [...this.graph.executionOrder],
    };
  }
}