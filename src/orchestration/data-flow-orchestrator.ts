import { Message } from "./types.js";

type NodeId = string;
type NodeState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

interface Node {
  id: NodeId;
  source: Message;
  execute: (state: Record<NodeId, any>) => Promise<any>;
  initialState: NodeState;
}

interface Edge {
  from: NodeId;
  to: NodeId;
  transform: (input: any) => any;
}

interface DataFlowGraph {
  nodes: Map<NodeId, Node>;
  edges: Edge[];
}

export class DataFlowOrchestrator {
  private graph: DataFlowGraph;
  private executionState: Record<NodeId, any> = {};
  private lineage: Record<NodeId, any>[] = [];

  constructor(graph: DataFlowGraph) {
    this.graph = graph;
    this.initializeState();
  }

  private initializeState(): void {
    for (const [id, node] of this.graph.nodes.entries()) {
      this.executionState[id] = {
        state: node.initialState,
        output: null,
        input: null,
      };
    }
  }

  private topologicalSort(): NodeId[] {
    const adj: Map<NodeId, NodeId[]> = new Map();
    const inDegree: Map<NodeId, number> = new Map();

    for (const nodeId of this.graph.nodes.keys()) {
      adj.set(nodeId, []);
      inDegree.set(nodeId, 0);
    }

    for (const edge of this.graph.edges) {
      adj.get(edge.from)?.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    const queue: NodeId[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const sortedOrder: NodeId[] = [];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      sortedOrder.push(u);

      for (const v of adj.get(u) || []) {
        const newDegree = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, newDegree);
        if (newDegree === 0) {
          queue.push(v);
        }
      }
    }

    if (sortedOrder.length !== this.graph.nodes.size) {
      throw new Error("Graph contains a cycle, cannot determine execution order.");
    }
    return sortedOrder;
  }

  public async run(): Promise<Record<NodeId, any>> {
    const executionOrder = this.topologicalSort();
    
    for (const nodeId of executionOrder) {
      const node = this.graph.nodes.get(nodeId)!;

      if (this.executionState[nodeId].state === "COMPLETED") {
        continue;
      }

      try {
        this.executionState[nodeId].state = "RUNNING";
        
        const inputs = this.resolveInputs(nodeId);
        
        const result = await node.execute(this.executionState);
        
        this.executionState[nodeId].output = result;
        this.executionState[nodeId].state = "COMPLETED";
        this.recordLineage(nodeId, result);

      } catch (error) {
        this.executionState[nodeId].state = "FAILED";
        await this.handleFailure(nodeId, error);
        throw new Error(`Pipeline failed at node ${nodeId}: ${(error as Error).message}`);
      }
    }

    return this.executionState;
  }

  private resolveInputs(nodeId: NodeId): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    for (const edge of this.graph.edges) {
      if (edge.to === nodeId) {
        const sourceState = this.executionState[edge.from];
        if (sourceState && sourceState.output !== null) {
          inputs[edge.from] = edge.transform(sourceState.output);
        }
      }
    }
    return inputs;
  }

  private async handleFailure(failedNodeId: NodeId, error: any): Promise<void> {
    console.error(`[Failure Handler] Node ${failedNodeId} failed. Attempting recovery or logging.`);
    // In a real system, this would involve retries, fallback paths, or alerting.
    // For this implementation, we just log and mark the state.
    this.lineage.push({
      nodeId: failedNodeId,
      status: "FAILURE",
      error: (error as Error).message,
      timestamp: Date.now(),
    });
  }

  private recordLineage(nodeId: NodeId, output: any): void {
    this.lineage.push({
      nodeId: nodeId,
      status: "SUCCESS",
      outputSummary: JSON.stringify(output).substring(0, 100) + "...",
      timestamp: Date.now(),
    });
  }

  public getLineage(): Record<NodeId, any>[] {
    return this.lineage;
  }
}