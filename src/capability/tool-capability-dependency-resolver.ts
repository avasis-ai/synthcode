import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Context {
  // Placeholder for current state, available resources, etc.
  [key: string]: unknown;
}

interface CapabilityNode {
  name: string;
  version: string;
  description: string;
  prerequisites: string[]; // Names of capabilities required before this one
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

interface DependencyEdge {
  source: string;
  target: string;
  constraint: string; // e.g., "requires_v2", "compatible_with_v1"
}

interface CapabilityDependencyGraph {
  nodes: Map<string, CapabilityNode>;
  edges: DependencyEdge[];
}

export class CapabilityResolutionError extends Error {
  constructor(message: string, public details: { path: string[]; reason: string }) {
    super(message);
    super.name = "CapabilityResolutionError";
  }
}

export type ResolvedStep = {
  capabilityName: string;
  version: string;
  inputMapping: Record<string, any>;
  executionOrder: number;
};

export class ToolCapabilityDependencyResolver {
  private graph: CapabilityDependencyGraph;

  constructor(graph: CapabilityDependencyGraph) {
    this.graph = graph;
  }

  private validatePath(path: string[], context: Context): boolean {
    if (path.length === 0) return true;

    // Simplified validation: check if all nodes in the path exist in the graph
    for (const nodeName of path) {
      if (!this.graph.nodes.has(nodeName)) {
        return false;
      }
    }

    // Advanced validation (omitted for brevity but would check constraints against context)
    return true;
  }

  public resolveDependencies(target: string, context: Context): ResolvedStep[] {
    const targetNode = this.graph.nodes.get(target);
    if (!targetNode) {
      throw new CapabilityResolutionError(
        `Target capability '${target}' not found in the graph.`,
        { path: [], reason: `Target capability missing` }
      );
    }

    const requiredPath: string[] = [target];
    const visited = new Set<string>();
    const queue: string[] = [target];

    // Simple BFS to find *a* valid path (assuming prerequisites form a DAG)
    // In a real system, this would involve topological sort and constraint checking.
    let currentQueue: string[] = [target];
    let pathFound: string[] | null = null;

    while (currentQueue.length > 0) {
      const current = currentQueue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === target) {
        // This simple BFS structure needs refinement for true dependency resolution.
        // For this implementation, we assume prerequisites must be resolved first.
        const prerequisites = this.graph.nodes.get(target)?.prerequisites || [];
        if (prerequisites.length === 0) {
            pathFound = [target];
            break;
        }
        // Recursive/Iterative dependency gathering (simplified)
        let tempPath: string[] = [target];
        let success = true;
        for (const prereq of prerequisites) {
            const prereqNode = this.graph.nodes.get(prereq);
            if (!prereqNode) {
                throw new CapabilityResolutionError(
                    `Prerequisite '${prereq}' for '${target}' is missing.`,
                    { path: [target], reason: `Missing prerequisite` }
                );
            }
            tempPath.unshift(prereq);
            // Recursively ensure prerequisites of prerequisites are met
            // (This part is highly complex and simplified here)
        }
        pathFound = tempPath;
        break;
      }
      // For simplicity, we only check direct prerequisites of the target for the final path.
    }

    if (!pathFound) {
        throw new CapabilityResolutionError(
            `Could not determine a valid dependency path for '${target}'.`,
            { path: [], reason: "Cycle detected or path unreachable" }
        );
    }

    // 3. Construct the final execution plan (Topological Sort order)
    const finalPlan: ResolvedStep[] = [];
    const orderedCapabilities: string[] = pathFound; // Assuming pathFound is already topologically sorted

    for (let i = 0; i < orderedCapabilities.length; i++) {
      const name = orderedCapabilities[i];
      const node = this.graph.nodes.get(name)!;

      finalPlan.push({
        capabilityName: name,
        version: node.version,
        inputMapping: { /* Placeholder for actual data flow mapping */ },
        executionOrder: i,
      });
    }

    return finalPlan;
  }
}