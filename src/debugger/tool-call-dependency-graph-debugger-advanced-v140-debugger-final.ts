import {
  DebuggerContext,
  ToolCallDependencyGraph,
  GraphStateSnapshot,
  DebugEvent,
} from "./tool-call-dependency-graph-debugger-advanced-v140-debugger-final-dependencies.js";

export class DebuggerEngine {
  private graph: ToolCallDependencyGraph;
  private context: DebuggerContext;

  constructor(graph: ToolCallDependencyGraph, initialContext: DebuggerContext) {
    this.graph = graph;
    this.context = initialContext;
  }

  public attachDebugger(): void {
    console.log("Debugger attached to ToolCallDependencyGraph.");
    this.context.updateGraphState(this.graph.getCurrentState());
    console.log("Initial graph state captured.");
  }

  public stepIntoNode(nodeId: string): void {
    if (!this.graph.hasNode(nodeId)) {
      throw new Error(`Node with ID ${nodeId} not found in the graph.`);
    }

    const preStepState = this.context.getCurrentGraphState();
    this.graph.executeStepIntoNode(nodeId);
    const postStepState = this.graph.getCurrentState();

    this.context.recordStep(
      {
        type: "step_into_node",
        nodeId: nodeId,
        preState: preStepState,
        postState: postStepState,
        message: `Stepped into node ${nodeId}.`,
      }
    );
    console.log(`Successfully stepped into node: ${nodeId}`);
  }

  public stepOverEdge(edgeId: string): void {
    if (!this.graph.hasEdge(edgeId)) {
      throw new Error(`Edge with ID ${edgeId} not found in the graph.`);
    }

    const preStepState = this.context.getCurrentGraphState();
    this.graph.executeStepOverEdge(edgeId);
    const postStepState = this.graph.getCurrentState();

    this.context.recordStep(
      {
        type: "step_over_edge",
        edgeId: edgeId,
        preState: preStepState,
        postState: postStepState,
        message: `Stepped over edge ${edgeId}.`,
      }
    );
    console.log(`Successfully stepped over edge: ${edgeId}`);
  }

  public getGraphStateSnapshot(): GraphStateSnapshot {
    return this.context.getGraphStateSnapshot();
  }

  public getStepHistory(): DebugEvent[] {
    return this.context.getStepHistory();
  }
}

export { DebuggerEngine };