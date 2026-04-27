import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export interface FlowNode {
  id: string;
  name: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  execute: (context: Map<string, any>) => Promise<any>;
}

export class FlowGraph {
  private nodes: Map<string, FlowNode>;
  private adjacencyList: Map<string, Set<string>>;

  constructor(nodes: FlowNode[]) {
    this.nodes = new Map<string, FlowNode>();
    this.adjacencyList = new Map<string, Set<string>>();
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, new Set<string>());
    }
    this.buildGraph();
  }

  private buildGraph(): void {
    for (const node of this.nodes.values()) {
      for (const dependencyId of node.dependencies) {
        if (this.nodes.has(dependencyId)) {
          this.adjacencyList.get(dependencyId)!.add(node.id);
        }
      }
    }
  }

  public hasCycle(): boolean {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (this.dfsCycleCheck(nodeId, visited, recursionStack)) {
          return true;
        }
      }
    }
    return false;
  }

  private dfsCycleCheck(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = this.adjacencyList.get(nodeId) || new Set<string>();
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        if (this.dfsCycleCheck(neighborId, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighborId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  public topologicalSort(): string[] | null {
    const visited: Set<string> = new Set();
    const sortedOrder: string[] = [];
    const stack: string[] = [];

    const dfsVisit = (nodeId: string) => {
      visited.add(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || new Set<string>();

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          dfsVisit(neighborId);
        }
      }
      stack.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfsVisit(nodeId);
      }
    }

    const sorted = stack.reverse();
    return sorted;
  }
}