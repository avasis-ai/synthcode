import { DependencyEdge } from "./dependency-graph-builder-v2";

export interface TemporalConstraint extends DependencyEdge {
  startTime?: number;
  endTime?: number;
  requiredResources: Record<string, { lockDuration: number; owner: string }>;
}

export interface DependencyGraph {
  nodes: Set<string>;
  edges: Set<DependencyEdge | TemporalConstraint>;
}

export class DependencyGraphBuilderV3 {
  private graph: DependencyGraph = {
    nodes: new Set<string>(),
    edges: new Set<DependencyEdge | TemporalConstraint>(),
  };

  private addNode(nodeId: string): void {
    this.graph.nodes.add(nodeId);
  }

  private addEdge(edge: DependencyEdge | TemporalConstraint): void {
    this.graph.edges.add(edge);
    const source = (edge as any).source;
    const target = (edge as any).target;
    if (source) this.addNode(source);
    if (target) this.addNode(target);
  }

  private validateResourceConflicts(constraints: TemporalConstraint[]): boolean {
    const resourceTimeline: Map<string, { start: number; end: number; owner: string }[]> = new Map();

    for (const constraint of constraints) {
      if (!constraint.requiredResources) continue;

      for (const [resourceName, lock] of Object.entries(constraint.requiredResources)) {
        const resourceLocks = resourceTimeline.get(resourceName) || [];
        const newLock: { start: number; end: number; owner: string } = {
          start: constraint.startTime || 0,
          end: constraint.endTime || 0,
          owner: lock.owner,
        };

        // Simple overlap check: Check if the new lock overlaps with any existing lock
        for (const existingLock of resourceLocks) {
          const overlapStart = Math.max(newLock.start, existingLock.start);
          const overlapEnd = Math.min(newLock.end, existingLock.end);

          if (overlapStart < overlapEnd) {
            // Conflict detected: Overlapping time window
            return false;
          }
        }
        resourceLocks.push(newLock);
        resourceTimeline.set(resourceName, resourceLocks);
      }
    }
    return true;
  }

  public buildGraph(dependencies: DependencyEdge[], constraints: TemporalConstraint[]): DependencyGraph {
    this.graph = {
      nodes: new Set<string>(),
      edges: new Set<DependencyEdge | TemporalConstraint>(),
    };

    // 1. Process standard dependencies
    for (const dep of dependencies) {
      this.addEdge(dep);
    }

    // 2. Process temporal constraints
    for (const constraint of constraints) {
      this.addEdge(constraint);
    }

    // 3. Validate conflicts
    if (!this.validateResourceConflicts(constraints)) {
      throw new Error("Conflict detected: Temporal constraints specify overlapping resource locks.");
    }

    return this.graph;
  }
}