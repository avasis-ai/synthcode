import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ConstraintType = "BEFORE" | "AFTER" | "REQUIRES_RESOURCE";

export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<{ target: string; constraint: ConstraintType; resource?: string }>>;
  isValid: boolean;
}

export class ToolDependencyBuilder {
  private nodes: Set<string>;
  private edges: Map<string, Set<{ target: string; constraint: ConstraintType; resource?: string }>>;

  constructor(initialNodes: string[] = []) {
    this.nodes = new Set<string>(initialNodes);
    this.edges = new Map<string, Set<{ target: string; constraint: ConstraintType; resource?: string }>>();
  }

  private ensureNodeExists(toolId: string): void {
    if (!this.nodes.has(toolId)) {
      this.nodes.add(toolId);
    }
  }

  addToolCall(toolId: string, input: any, context: any): void {
    this.ensureNodeExists(toolId);
    // In a real scenario, input/context would be used to derive more complex nodes/edges.
    // For this structure, we just ensure the node exists.
  }

  addConstraint(source: string, target: string, constraint: ConstraintType, resource?: string): void {
    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      throw new Error(`Nodes ${source} or ${target} must be added first.`);
    }

    if (!this.edges.has(source)) {
      this.edges.set(source, new Set());
    }

    const edge: { target: string; constraint: ConstraintType; resource?: string } = {
      target,
      constraint,
      resource: resource ?? undefined,
    };

    this.edges.get(source)!.add(edge);
  }

  private hasCycle(startNode: string, visited: Set<string>, recursionStack: Set<string>, currentEdges: Map<string, Set<{ target: string; constraint: ConstraintType; resource?: string }>>): boolean {
    visited.add(startNode);
    recursionStack.add(startNode);

    const neighbors = currentEdges.get(startNode) || new Set();

    for (const edge of neighbors) {
      const neighbor = edge.target;
      if (!visited.has(neighbor)) {
        if (this.hasCycle(neighbor, visited, recursionStack, currentEdges)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(startNode);
    return false;
  }

  private detectCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        if (this.hasCycle(node, visited, recursionStack, this.edges)) {
          return true;
        }
      }
    }
    return false;
  }

  private detectResourceConflicts(): boolean {
    const resourceUsage: Map<string, Set<string>> = new Map(); // Resource -> Set of nodes using it

    for (const [source, outgoingEdges] of this.edges.entries()) {
      for (const edge of outgoingEdges) {
        if (edge.resource) {
          if (!resourceUsage.has(edge.resource)) {
            resourceUsage.set(edge.resource, new Set());
          }
          resourceUsage.get(edge.resource)!.add(source);
        }
      }
    }

    // Simple conflict detection: If a resource is required by more than one distinct source node
    // without explicit temporal separation (which is complex to model here, so we flag any overlap).
    for (const [resource, users] of resourceUsage.entries()) {
      if (users.size > 1) {
        // In a full implementation, we'd check if the overlap violates temporal constraints.
        // Here, we just flag it as a potential conflict.
        return true;
      }
    }
    return false;
  }

  build(): DependencyGraph {
    const hasCycle = this.detectCycles();
    const hasConflict = this.detectResourceConflicts();

    const graph: DependencyGraph = {
      nodes: this.nodes,
      edges: this.edges,
      isValid: !hasCycle && !hasConflict,
    };

    return graph;
  }
}