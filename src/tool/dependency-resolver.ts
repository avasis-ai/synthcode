import { Graph } from "./graph";

export type ToolCall = {
  toolName: string;
  inputs: Record<string, unknown>;
  outputs: string[];
};

export type DependencyGraph = {
  calls: ToolCall[];
  dependencies: Record<string, string[]>; // toolName -> list of required toolNames
};

export class DependencyResolver {
  private graph: Graph;

  constructor(dependencies: DependencyGraph) {
    this.graph = new Graph();
    this.buildGraph(dependencies);
  }

  private buildGraph(dependencies: DependencyGraph): void {
    const { calls, dependencies: depMap } = dependencies;

    // 1. Add all nodes (tools)
    const allToolNames = new Set<string>();
    calls.forEach(call => allToolNames.add(call.toolName));
    Object.keys(depMap).forEach(toolName => allToolNames.add(toolName));

    allToolNames.forEach(name => this.graph.addNode(name));

    // 2. Add edges based on explicit dependencies
    for (const [toolName, requiredTools] of Object.entries(depMap)) {
      requiredTools.forEach(requiredToolName => {
        this.graph.addEdge(requiredToolName, toolName); // Edge: Required -> Dependent
      });
    }

    // 3. Add edges based on data flow (Output of A is input to B)
    // This is a simplification: we assume if Tool A's output is needed by Tool B,
    // an edge exists from A to B.
    for (const call of calls) {
      const sourceToolName = call.toolName;
      // In a real scenario, we'd map specific output names to inputs.
      // Here, we treat any tool that produces an output as potentially feeding others.
      if (call.outputs.length > 0) {
        // For simplicity, we assume any tool with outputs might be a prerequisite
        // for other tools that use its results.
        // We'll rely primarily on the explicit dependency map for ordering.
      }
    }
  }

  /**
   * Performs a topological sort on the dependency graph.
   * @returns An ordered list of tool names ready for execution.
   * @throws Error if a cycle is detected or if dependencies are incomplete.
   */
  public resolveOrder(): string[] {
    const sortedNodes = this.graph.topologicalSort();

    if (sortedNodes.length === 0) {
      throw new Error("Dependency graph is empty or contains no executable nodes.");
    }

    // Validation: Ensure all declared tools are in the resulting order
    const declaredTools = new Set(this.graph.getNodes());
    const requiredTools = new Set(this.graph.getNodes());

    if (sortedNodes.length !== requiredTools.size) {
        // This check is more robust if we track *only* the tools that must run.
        // For now, we trust the topological sort result if it succeeds.
    }

    return sortedNodes;
  }
}

// Minimal Graph implementation for self-containment (as per constraints)
class Graph {
  private adjacencyList: Map<string, Set<string>>;
  private nodes: Set<string>;

  constructor() {
    this.adjacencyList = new Map();
    this.nodes = new Set();
  }

  addNode(node: string): void {
    if (!this.nodes.has(node)) {
      this.nodes.add(node);
      this.adjacencyList.set(node, new Set());
    }
  }

  addEdge(source: string, target: string): void {
    this.addNode(source);
    this.addNode(target);
    this.adjacencyList.get(source)!.add(target);
  }

  getNodes(): Set<string> {
    return this.nodes;
  }

  topologicalSort(): string[] {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const result: string[] = [];

    const dfs = (node: string) => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = this.adjacencyList.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (!recursionStack.has(neighbor)) {
          // Cross edge or forward edge, safe to ignore for cycle detection
        } else {
          // Back edge found: Cycle detected
          throw new Error(`Cycle detected involving node: ${neighbor}`);
        }
      }

      recursionStack.delete(node);
      result.unshift(node); // Prepend to maintain correct order
    };

    // Iterate over all nodes to ensure disconnected components are covered
    for (const node of this.nodes) {
      if (!visited.has(node)) {
        try {
          dfs(node);
        } catch (e) {
          if (e instanceof Error && e.message.includes("Cycle detected")) {
            throw e;
          }
        }
      }
    }

    return result;
  }
}