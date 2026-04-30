import { DependencyGraph, Context } from "./dependency-graph-types";

export interface TemporalResourceConstraint {
  resourceId: string;
  startTime: number;
  endTime: number;
  requiredAmount: number;
}

export interface Constraint {
  type: "temporal_resource" | "other";
  data: any;
}

export type PathResult = {
  path: string[];
  updatedContext: Context;
};

export class ContextualConstraintPropagatorV10 {
  private readonly MAX_TIME_HORIZON: number = 10000;

  constructor() {}

  private checkTemporalFeasibility(
    currentConstraints: Constraint[],
    newConstraint: TemporalResourceConstraint,
    currentTime: number
  ): boolean {
    const proposedStart = Math.max(currentTime, newConstraint.startTime);
    const proposedEnd = proposedStart + (newConstraint.endTime - newConstraint.startTime);

    if (proposedEnd > this.MAX_TIME_HORIZON) {
      return false;
    }

    for (const constraint of currentConstraints) {
      if (constraint.type === "temporal_resource") {
        const existing = constraint.data as TemporalResourceConstraint;
        const proposedStartAbs = Math.max(currentTime, newConstraint.startTime);
        const proposedEndAbs = proposedStartAbs + (newConstraint.endTime - newConstraint.startTime);

        // Check for overlap
        if (proposedStartAbs < existing.endTime && proposedEndAbs > existing.startTime) {
          const overlapDuration = Math.min(proposedEndAbs, existing.endTime) - Math.max(proposedStartAbs, existing.startTime);
          if (overlapDuration > 0) {
            const totalRequired = newConstraint.requiredAmount + existing.requiredAmount;
            const availableCapacity = 1; // Assuming unit capacity for simplicity in this model
            if (totalRequired > availableCapacity) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  private propagateConstraints(
    graph: DependencyGraph,
    initialContext: Context,
    path: string[],
    currentConstraints: Constraint[],
    currentTime: number
  ): {
    feasible: boolean;
    updatedContext: Context;
    newConstraints: Constraint[];
  } {
    let context = { ...initialContext };
    let constraints = [...currentConstraints];
    let time = currentTime;

    for (const nodeId of path) {
      const node = graph.nodes.get(nodeId);
      if (!node) {
        return { feasible: false, updatedContext: context, newConstraints: [] };
      }

      const nodeConstraints = node.constraints || [];
      const temporalConstraints: TemporalResourceConstraint[] = nodeConstraints
        .filter((c: any) => c.type === "temporal_resource")
        .map((c: any) => ({
          resourceId: c.data.resourceId,
          startTime: c.data.startTime,
          endTime: c.data.endTime,
          requiredAmount: c.data.requiredAmount,
        }));

      for (const trc of temporalConstraints) {
        if (!this.checkTemporalFeasibility(constraints, trc, time)) {
          return { feasible: false, updatedContext: context, newConstraints: [] };
        }
        constraints.push({
          type: "temporal_resource",
          data: trc,
        });
      }

      // Simulate context update based on node execution
      context = { ...context, ...node.contextUpdate };
      time += node.executionTime || 1;
    }

    return { feasible: true, updatedContext: context, newConstraints: constraints };
  }

  resolveFeasiblePaths(
    graph: DependencyGraph,
    initialContext: Context
  ): PathResult[] {
    const allPaths: string[][] = this.findAllPaths(graph);
    const feasiblePaths: PathResult[] = [];

    for (const path of allPaths) {
      const { feasible, updatedContext, newConstraints } = this.propagateConstraints(
        graph,
        initialContext,
        path,
        [],
        0
      );

      if (feasible) {
        feasiblePaths.push({
          path: path,
          updatedContext: updatedContext,
        });
      }
    }

    return feasiblePaths;
  }

  private findAllPaths(graph: DependencyGraph): string[][] {
    const startNodeId = Array.from(graph.nodes.keys())[0];
    if (!startNodeId) return [];

    const paths: string[][] = [];

    const dfs = (currentNodeId: string, currentPath: string[]) => {
      currentPath.push(currentNodeId);
      if (graph.hasSuccessors(currentNodeId)) {
        for (const successorId of graph.getSuccessors(currentNodeId)) {
          if (!currentPath.includes(successorId)) {
            dfs(successorId, [...currentPath]);
          }
        }
      } else {
        paths.push([...currentPath]);
      }
    };

    dfs(startNodeId, []);
    return paths;
  }
}