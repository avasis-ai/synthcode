import { Graph } from "./graph-utils";

export interface ServiceNode {
  name: string;
  description: string;
  endpoint: string;
}

export type DependencyType = "requires" | "fails_over_to" | "optional";

export interface ServiceEdge {
  source: string;
  target: string;
  type: DependencyType;
  description: string;
}

export class ServiceDependencyGraphBuilder {
  private nodes: Map<string, ServiceNode>;
  private edges: ServiceEdge[];

  constructor() {
    this.nodes = new Map<string, ServiceNode>();
    this.edges = [];
  }

  addService(service: ServiceNode): this {
    if (this.nodes.has(service.name)) {
      throw new Error(`Service ${service.name} already exists.`);
    }
    this.nodes.set(service.name, service);
    return this;
  }

  addDependency(sourceName: string, targetName: string, type: DependencyType, description: string): this {
    if (!this.nodes.has(sourceName)) {
      throw new Error(`Source service ${sourceName} not found.`);
    }
    if (!this.nodes.has(targetName)) {
      throw new Error(`Target service ${targetName} not found.`);
    }

    const edge: ServiceEdge = {
      source: sourceName,
      target: targetName,
      type: type,
      description: description,
    };
    this.edges.push(edge);
    return this;
  }

  private detectCycle(startNode: string, currentPath: Set<string>, visited: Set<string>, graph: Graph): boolean {
    if (currentPath.has(startNode)) {
      return true;
    }
    if (visited.has(startNode)) {
      return false;
    }

    currentPath.add(startNode);
    visited.add(startNode);

    const neighbors = graph.getNeighbors(startNode);
    for (const neighbor of neighbors) {
      if (this.detectCycle(neighbor, currentPath, visited, graph)) {
        return true;
      }
    }

    currentPath.delete(startNode);
    return false;
  }

  validateGraph(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeNames = Array.from(this.nodes.keys());

    // 1. Check for missing services in dependencies
    for (const edge of this.edges) {
      if (!this.nodes.has(edge.source)) {
        errors.push(`Dependency error: Source service ${edge.source} does not exist.`);
      }
      if (!this.nodes.has(edge.target)) {
        errors.push(`Dependency error: Target service ${edge.target} does not exist.`);
      }
    }

    // 2. Check for circular dependencies
    const graph = new Graph(nodeNames);
    for (const edge of this.edges) {
      graph.addEdge(edge.source, edge.target);
    }

    const visited = new Set<string>();
    for (const nodeName of nodeNames) {
      if (this.detectCycle(nodeName, new Set<string>(), visited, graph)) {
        errors.push(`Circular dependency detected involving ${nodeName}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  resolveGraph(): { graph: Graph; nodes: ServiceNode[]; edges: ServiceEdge[] } {
    const nodeNames = Array.from(this.nodes.keys());
    const graph = new Graph(nodeNames);

    for (const edge of this.edges) {
      graph.addEdge(edge.source, edge.target);
    }

    return {
      graph: graph,
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
    };
  }
}