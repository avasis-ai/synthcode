import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ToolNode {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
}

export interface DependencyGraph {
  nodes: Map<string, ToolNode>;
  adjList: Map<string, Set<string>>;
}

export interface AnalysisReport {
  cycles: string[];
  redundancies: string[];
  missingPrerequisites: { node: string; missing: string }[];
  graphStructure: DependencyGraph;
}

export class DependencyGraphAnalyzer {
  private graph: DependencyGraph;

  constructor(nodes: ToolNode[]) {
    this.graph = this.buildGraph(nodes);
  }

  private buildGraph(nodes: ToolNode[]): DependencyGraph {
    const nodesMap = new Map<string, ToolNode>();
    const adjList = new Map<string, Set<string>>();

    for (const node of nodes) {
      nodesMap.set(node.name, node);
      adjList.set(node.name, new Set<string>());
    }

    for (const node of nodes) {
      for (const dependencyName of node.dependencies) {
        if (nodesMap.has(dependencyName)) {
          adjList.get(node.name)!.add(dependencyName);
        }
      }
    }

    return { nodes: nodesMap, adjList };
  }

  public analyze(): AnalysisReport {
    const cycles = this.detectCycles();
    const redundancies = this.detectRedundancies();
    const missingPrerequisites = this.detectMissingPrerequisites();

    return {
      cycles,
      redundancies,
      missingPrerequisites,
      graphStructure: this.graph,
    };
  }

  private detectCycles(): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (nodeName: string, path: string[]): void => {
      visited.add(nodeName);
      recursionStack.add(nodeName);
      path.push(nodeName);

      const neighbors = this.graph.adjList.get(nodeName) || new Set<string>();
      for (const neighborName of neighbors) {
        if (!visited.has(neighborName)) {
          dfs(neighborName, path);
        } else if (recursionStack.has(neighborName)) {
          const cycleStart = path.indexOf(neighborName);
          if (cycleStart !== -1) {
            const cycle = [...path.slice(cycleStart), neighborName].join(" -> ");
            cycles.push(cycle);
          }
        }
      }

      recursionStack.delete(nodeName);
      path.pop();
    };

    for (const nodeName of this.graph.nodes.keys()) {
      if (!visited.has(nodeName)) {
        dfs(nodeName, []);
      }
    }

    return cycles;
  }

  private detectRedundancies(): string[] {
    const redundancies: string[] = [];
    const nodeNames = Array.from(this.graph.nodes.keys());

    for (let i = 0; i < nodeNames.length; i++) {
      for (let j = i + 1; j < nodeNames.length; j++) {
        const nodeA = this.graph.nodes.get(nodeNames[i])!;
        const nodeB = this.graph.nodes.get(nodeNames[j])!;

        const commonDependencies = nodeA.dependencies.filter(dep => nodeB.dependencies.includes(dep));
        if (commonDependencies.length > 0) {
          redundancies.push(
            `Nodes ${nodeA.name} and ${nodeB.name} both depend on: ${commonDependencies.join(", ")}`
          );
        }
      }
    }
    return redundancies;
  }

  private detectMissingPrerequisites(): { node: string; missing: string }[] {
    const missing: { node: string; missing: string }[] = [];
    const nodeNames = Array.from(this.graph.nodes.keys());

    for (const nodeName of nodeNames) {
      const node = this.graph.nodes.get(nodeName)!;
      for (const dependency of node.dependencies) {
        if (!this.graph.nodes.has(dependency)) {
          missing.push({ node: nodeName, missing: dependency });
        }
      }
    }
    return missing;
  }
}