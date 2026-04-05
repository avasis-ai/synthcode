import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface DependencyGraph {
  nodes: Map<string, { id: string; type: string; metadata: any }>;
  dependencies: Set<string>;
  preconditions: Map<string, Precondition[]>;
}

export interface Precondition {
  nodeId: string;
  description: string;
}

export class ToolCallDependencyGraphBuilder {
  private nodes: Map<string, { id: string; type: string; metadata: any }> = new Map();
  private dependencies: Set<string> = new Set();
  private preconditions: Map<string, Precondition[]> = new Map();

  constructor(initialNodes: { id: string; type: string; metadata: any }[]) {
    for (const node of initialNodes) {
      this.nodes.set(node.id, node);
    }
  }

  addDependency(sourceId: string, targetId: string, reason: string): void {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error("One or both node IDs not found in the graph.");
    }
    const dependencyKey = `${sourceId}->${targetId}`;
    this.dependencies.add(dependencyKey);
    // In a real scenario, we might store the reason with the dependency,
    // but for simplicity matching the prompt structure, we just add the edge.
  }

  addPrecondition(nodeId: string, precondition: Precondition): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node ID ${nodeId} not found.`);
    }
    if (!this.preconditions.has(nodeId)) {
      this.preconditions.set(nodeId, []);
    }
    const existingPreconditions = this.preconditions.get(nodeId)!;
    existingPreconditions.push(precondition);
  }

  private detectCycle(startNodeId: string, visited: Set<string>, recursionStack: Set<string>, currentPath: string[]): boolean {
    visited.add(startNodeId);
    recursionStack.add(startNodeId);
    currentPath.push(startNodeId);

    const neighbors = Array.from(this.dependencies.keys()).filter(key => key.startsWith(`${startNodeId}->`));
    const targetIds = neighbors.map(key => key.substring(key.indexOf("->") + 2));

    for (const neighborId of targetIds) {
      if (!visited.has(neighborId)) {
        if (this.detectCycle(neighborId, visited, recursionStack, currentPath)) {
          return true;
        }
      } else if (recursionStack.has(neighborId)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(startNodeId);
    currentPath.pop();
    return false;
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (this.detectCycle(nodeId, visited, recursionStack, [])) {
          return true;
        }
      }
    }
    return false;
  }

  build(): DependencyGraph {
    if (this.hasCycle()) {
      throw new Error("Cannot build graph: Cycle detected in dependencies.");
    }

    const graph: DependencyGraph = {
      nodes: new Map(this.nodes),
      dependencies: this.dependencies,
      preconditions: this.preconditions,
    };

    return graph;
  }
}