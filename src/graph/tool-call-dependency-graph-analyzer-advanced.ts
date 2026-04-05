import { Message, ToolUseBlock, ContentBlock } from "./types";

export interface DependencyGraph {
  nodes: Map<string, { toolName: string; inputs: Record<string, unknown>; requiredInputs: string[] }>;
  edges: Set<string>; // Set of "sourceId->targetId"
}

export interface AnalysisReport {
  riskScore: number;
  risks: {
    type: "Cycle" | "DeadEnd" | "UnresolvedDependency";
    description: string;
    path: string[];
    severity: "High" | "Medium" | "Low";
  }[];
  suggestions: string[];
}

export class ToolCallDependencyGraphAnalyzerAdvanced {
  private readonly MAX_DEPTH: number = 10;

  analyze(graph: DependencyGraph): AnalysisReport {
    const risks: {
      type: "Cycle" | "DeadEnd" | "UnresolvedDependency";
      description: string;
      path: string[];
      severity: "High" | "Medium" | "Low";
    }[] = [];
    const suggestions: string[] = [];
    let totalRiskScore = 0;

    // 1. Cycle Detection (DFS based)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = this.detectCycleDFS(graph, nodeId, visited, recursionStack, []);
        if (cycle) {
          risks.push({
            type: "Cycle",
            description: `Circular dependency detected involving tool call: ${cycle.join(" -> ")}`,
            path: cycle,
            severity: "High",
          });
          totalRiskScore += 50;
        }
      }
    }

    // 2. Dead End / Unresolved Dependency Detection
    for (const [nodeId, node] of graph.nodes.entries()) {
      const outgoingEdges = Array.from(graph.edges).filter(edge => edge.startsWith(nodeId + "->"));
      const incomingEdges = Array.from(graph.edges).filter(edge => edge.endsWith("->" + nodeId));

      // Check for nodes that require inputs but have no incoming edges (potential start points, but check for missing prerequisites)
      if (node.requiredInputs.length > 0 && incomingEdges.length === 0) {
        risks.push({
          type: "UnresolvedDependency",
          description: `Tool '${node.toolName}' requires inputs (${node.requiredInputs.join(', ')}) but no preceding tool call provides them.`,
          path: [nodeId],
          severity: "High",
        });
        totalRiskScore += 30;
      }

      // Check for nodes that are sinks (no outgoing edges) but might be part of a larger required flow
      if (outgoingEdges.length === 0 && node.requiredInputs.length > 0) {
        // This is more of a warning unless it's the final step
      }
    }

    // 3. Scoring and Suggestions
    const cycleCount = risks.filter(r => r.type === "Cycle").length;
    const unresolvedCount = risks.filter(r => r.type === "UnresolvedDependency").length;

    totalRiskScore += cycleCount * 10;
    totalRiskScore += unresolvedCount * 15;

    if (cycleCount > 0) {
      suggestions.push("Review the dependency flow to break the cycle. Consider restructuring the logic or adding explicit exit conditions.");
    }
    if (unresolvedCount > 0) {
      suggestions.push("Ensure all required inputs for tools are provided by preceding steps or initial context.");
    }
    if (totalRiskScore > 70) {
      suggestions.push("High risk detected. Manual review of the execution path is strongly recommended.");
    }

    return {
      riskScore: Math.min(100, totalRiskScore),
      risks: risks,
      suggestions: suggestions,
    };
  }

  private detectCycleDFS(
    graph: DependencyGraph,
    currentNodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(currentNodeId);
    recursionStack.add(currentNodeId);
    path.push(currentNodeId);

    const neighbors = Array.from(graph.edges)
      .filter(edge => edge.startsWith(currentNodeId + "->"));

    for (const edge of neighbors) {
      const nextNodeId = edge.split("->")[1];

      if (!visited.has(nextNodeId)) {
        const cycle = this.detectCycleDFS(graph, nextNodeId, visited, recursionStack, path);
        if (cycle) {
          return cycle;
        }
      } else if (recursionStack.has(nextNodeId)) {
        // Cycle detected
        const cycleStart = path.indexOf(nextNodeId);
        return [...path.slice(cycleStart), nextNodeId];
      }
    }

    recursionStack.delete(currentNodeId);
    path.pop();
    return null;
  }
}