import {
  ToolUseBlock,
  ToolResultMessage,
  ContentBlock,
} from "./types";

export type ToolCallNode = {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
};

export type DependencyGraph = {
  nodes: Map<string, ToolCallNode>;
  adj: Map<string, Set<string>>;
}

export class ToolCallDependencyGraphBuilder {
  private nodes: Map<string, ToolCallNode> = new Map();
  private adj: Map<string, Set<string>> = new Map();

  constructor(initialToolCalls: ToolCallNode[]) {
    initialToolCalls.forEach((toolCall) => this.addNode(toolCall));
  }

  private addNode(toolCall: ToolCallNode): void {
    if (this.nodes.has(toolCall.toolUseId)) {
      throw new Error(`Tool call with ID ${toolCall.toolUseId} already exists.`);
    }
    this.nodes.set(toolCall.toolUseId, toolCall);
    this.adj.set(toolCall.toolUseId, new Set());
  }

  public addDependency(
    dependentToolUseId: string,
    dependencyToolUseId: string,
  ): void {
    if (!this.nodes.has(dependentToolUseId)) {
      throw new Error(
        `Dependent tool call ID ${dependentToolUseId} not found in graph.`,
      );
    }
    if (!this.nodes.has(dependencyToolUseId)) {
      throw new Error(
        `Dependency tool call ID ${dependencyToolUseId} not found in graph.`,
      );
    }

    const dependents = this.adj.get(dependentToolUseId)!;
    if (dependents.has(dependencyToolUseId)) {
      return;
    }

    dependents.add(dependencyToolUseId);
  }

  public build(): {
    graph: DependencyGraph;
    executionOrder: string[];
  } {
    const graph: DependencyGraph = {
      nodes: this.nodes,
      adj: this.adj,
    };

    const executionOrder = this.topologicalSort();

    return {
      graph,
      executionOrder,
    };
  }

  private topologicalSort(): string[] {
    const inDegree: Map<string, number> = new Map();
    const queue: string[] = [];
    const sortedOrder: string[] = [];

    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    for (const [nodeId, neighbors] of this.adj.entries()) {
      for (const neighborId of neighbors) {
        if (inDegree.has(neighborId)) {
          inDegree.set(neighborId, (inDegree.get(neighborId)! + 1));
        }
      }
    }

    for (const nodeId of this.nodes.keys()) {
      if (inDegree.get(nodeId)! === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedOrder.push(u);

      const neighbors = this.adj.get(u)!;
      for (const v of neighbors) {
        const currentDegree = inDegree.get(v)!;
        const newDegree = currentDegree - 1;
        inDegree.set(v, newDegree);

        if (newDegree === 0) {
          queue.push(v);
        }
      }
    }

    if (sortedOrder.length !== this.nodes.size) {
      throw new Error("Cycle detected in tool call dependencies. Cannot determine execution order.");
    }

    return sortedOrder;
  }
}