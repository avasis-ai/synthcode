import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synth-code-types";

type DebuggerStep = "STEP" | "INSPECT" | "CONTINUE";

interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  data: any;
  dependencies: string[];
}

interface DebuggerContext {
  currentStep: DebuggerStep;
  currentNodeId: string | null;
  currentEdge: { from: string; to: string } | null;
  graphState: Map<string, GraphNode>;
  history: {
    step: DebuggerStep;
    nodeId: string | null;
    edge: { from: string; to: string } | null;
    stateSnapshot: any;
  }[];
}

export class ToolCallDependencyGraphDebugger {
  private context: DebuggerContext;

  constructor(initialGraphState: Map<string, GraphNode>) {
    this.context = {
      currentStep: "STEP",
      currentNodeId: null,
      currentEdge: null,
      graphState: initialGraphState,
      history: [],
    };
  }

  private updateContext(
    step: DebuggerStep,
    nodeId: string | null = null,
    edge: { from: string; to: string } | null = null,
    snapshot: any = null
  ): void {
    this.context.currentStep = step;
    this.context.currentNodeId = nodeId;
    this.context.currentEdge = edge;
    this.context.history.push({
      step: step,
      nodeId: nodeId,
      edge: edge,
      stateSnapshot: snapshot || JSON.parse(JSON.stringify(this.context.graphState)),
    });
  }

  public getContext(): DebuggerContext {
    return this.context;
  }

  public initializeDebugger(initialState: Map<string, GraphNode>): void {
    this.context.graphState = initialState;
    this.context.history = [];
    this.updateContext("STEP", null, null);
  }

  public stepNext(): void {
    const currentNodeId = this.context.currentNodeId;
    const graphState = this.context.graphState;

    if (!currentNodeId || !graphState.has(currentNodeId)) {
      console.warn("Cannot step: No current node or node not found.");
      return;
    }

    const node = graphState.get(currentNodeId)!;
    const nextDependencies = node.dependencies.filter(depId => {
      const nextNode = graphState.get(depId);
      return nextNode && !this.context.history.some(h => h.nodeId === depId);
    });

    if (nextDependencies.length === 0) {
      console.log("Reached end of traceable path.");
      this.updateContext("CONTINUE", null, null);
      return;
    }

    const nextNodeId = nextDependencies[0];
    const nextNode = graphState.get(nextNodeId)!;
    const edge: { from: string; to: string } = { from: currentNodeId, to: nextNodeId };

    this.updateContext("STEP", nextNodeId, edge);
    console.log(`Stepped to node: ${nextNodeId}`);
  }

  public stepInto(nodeId: string): void {
    const graphState = this.context.graphState;
    if (!graphState.has(nodeId)) {
      console.error(`Cannot step into unknown node: ${nodeId}`);
      return;
    }

    // Simulate entering the node's execution context
    this.updateContext("INSPECT", nodeId, null);
    console.log(`Stepped into node: ${nodeId}. Ready for inspection.`);
  }

  public continueExecution(): void {
    this.updateContext("CONTINUE", null, null);
    console.log("Continuing execution...");
    // In a real implementation, this would trigger the next graph traversal step
  }

  public inspectCurrentState(): void {
    const node = this.context.graphState.get(this.context.currentNodeId);
    if (!node) {
      console.log("No node currently selected for inspection.");
      return;
    }

    console.log("--- Inspection View ---");
    console.log(`Node ID: ${node.id}`);
    console.log(`Type: ${node.type}`);
    console.log(`Dependencies: ${node.dependencies.join(', ')}`);
    console.log("-----------------------");
  }
}