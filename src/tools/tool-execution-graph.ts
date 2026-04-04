import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type NodeId = string;

interface GraphNode {
  id: NodeId;
  type: "call" | "result";
  toolName: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
}

interface GraphEdge {
  from: NodeId;
  to: NodeId;
  dependency: string;
}

export class ToolExecutionGraph {
  private nodes: Map<NodeId, GraphNode> = new Map();
  private adjacencyList: Map<NodeId, Set<NodeId>> = new Map();
  private edges: Set<GraphEdge> = new Set();

  constructor() {}

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      return;
    }
    this.nodes.set(node.id, node);
    this.adjacencyList.set(node.id, new Set());
  }

  addEdge(fromId: NodeId, toId: NodeId, dependency: string): void {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error("One or both node IDs do not exist in the graph.");
    }
    if (!this.adjacencyList.has(fromId)) {
      throw new Error("Source node ID not found.");
    }
    if (!this.adjacencyList.get(fromId)!.has(toId)) {
      this.adjacencyList.get(fromId)!.add(toId);
      this.edges.add({ from: fromId, to: toId, dependency });
    }
  }

  processToolCalls(
    calls: { id: string; toolName: string; input: Record<string, unknown> }[],
    results: { id: string; content: string; isError?: boolean }[]
  ): void {
    const callNodes: GraphNode[] = calls.map((call, index) => ({
      id: `call_${call.id}`,
      type: "call",
      toolName: call.toolName,
      input: call.input,
    }));

    const resultNodes: GraphNode[] = results.map((result, index) => ({
      id: `result_${result.id}`,
      type: "result",
      toolName: "N/A",
      input: {},
      result: result.content,
      isError: result.isError,
    }));

    callNodes.forEach(node => this.addNode(node));
    resultNodes.forEach(node => this.addNode(node));

    // Assuming a simple sequential dependency for demonstration: Call -> Result
    for (let i = 0; i < calls.length; i++) {
      const callId = `call_${calls[i].id}`;
      const resultId = `result_${results[i].id}`;
      this.addEdge(callId, resultId, "Execution dependency");
    }
  }

  private getTopologicalOrder(): NodeId[] {
    const visited: Set<NodeId> = new Set();
    const recursionStack: Set<NodeId> = new Set();
    const sortedOrder: NodeId[] = [];

    const visit = (nodeId: NodeId) => {
      if (visited.has(nodeId)) return;
      if (recursionStack.has(nodeId)) {
        throw new Error("Cycle detected in the tool execution graph.");
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighborId of neighbors) {
        visit(neighborId);
      }

      recursionStack.delete(nodeId);
      sortedOrder.unshift(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    return sortedOrder;
  }

  executeGraph(): { node: GraphNode; result: string }[] {
    const executionOrder = this.getTopologicalOrder();
    const executedResults: Map<NodeId, string> = new Map();
    const finalExecution: { node: GraphNode; result: string }[] = [];

    for (const nodeId of executionOrder) {
      const node = this.nodes.get(nodeId)!;
      let output: string;

      if (node.type === "call") {
        // Simulate execution for a call node
        output = `Simulated execution for ${node.toolName} with input: ${JSON.stringify(node.input)}`;
        // In a real scenario, this would trigger the actual tool execution
      } else if (node.type === "result") {
        // Use the stored result
        output = node.result || "";
      } else {
        output = "";
      }

      finalExecution.push({ node, result: output });
      executedResults.set(nodeId, output);
    }
    return finalExecution;
  }

  serializeToDot(): string {
    let dot = "digraph ToolExecutionGraph {\n";
    dot += "  rankdir=LR;\n";
    dot += "  node [shape=box];\n\n";

    this.nodes.forEach((node, nodeId) => {
      let label = `ID: ${nodeId}\\nType: ${node.type}\\nTool: ${node.toolName}\\nInput: ${JSON.stringify(node.input)}`;
      if (node.result) {
        label += `\\nResult: ${node.result.substring(0, 50)}...`;
      }
      dot += `  ${nodeId} [label="${label}"];\n`;
    });

    dot += "\n";

    this.edges.forEach(edge => {
      dot += `  ${edge.from} -> ${edge.to} [label="${edge.dependency}"];\n`;
    });

    dot += "}\n";
    return dot;
  }
}