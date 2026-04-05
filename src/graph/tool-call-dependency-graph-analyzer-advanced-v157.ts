import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type ToolCallGraph = {
  nodes: Map<string, {
    message: Message;
    tool_uses: ToolUseBlock[];
  }>;
  edges: Set<string>; // Set of "sourceId->targetId"
};

export interface CostModel {
  [key: string]: {
    latencyMs: number;
    cost: number;
  };
}

export interface AnalysisReport {
  structuralIssues: string[];
  resourceConflicts: {
    resource: string;
    conflictingNodes: string[];
  }[];
  optimizationSuggestions: {
    type: "reordering" | "redundancy";
    description: string;
    suggestedOrder?: string[];
  }[];
  overallScore: number;
}

export class ToolCallDependencyGraphAnalyzerAdvancedV157 {
  private graph: ToolCallGraph;
  private costModel: CostModel | null;

  constructor(graph: ToolCallGraph, costModel: CostModel | null = null) {
    this.graph = graph;
    this.costModel = costModel;
  }

  private detectResourceConflicts(graph: ToolCallGraph): {
    resource: string;
    conflictingNodes: string[];
  }[] {
    const resourceMap = new Map<string, Set<string>>();

    for (const [nodeId, node] of graph.nodes.entries()) {
      for (const toolUse of node.tool_uses) {
        // Simulate resource usage detection based on tool name or input structure
        const resourceKey = `resource:${toolUse.name}`;
        if (!resourceMap.has(resourceKey)) {
          resourceMap.set(resourceKey, new Set());
        }
        resourceMap.get(resourceKey)!.add(nodeId);
      }
    }

    const conflicts: {
      resource: string;
      conflictingNodes: string[];
    }[] = [];

    for (const [resource, nodeIds] of resourceMap.entries()) {
      if (nodeIds.size > 1) {
        conflicts.push({
          resource: resource,
          conflictingNodes: Array.from(nodeIds),
        });
      }
    }
    return conflicts;
  }

  private analyzeOptimization(graph: ToolCallGraph): {
    type: "reordering" | "redundancy";
    description: string;
    suggestedOrder?: string[];
  }[] {
    const suggestions: {
      type: "reordering" | "redundancy";
      description: string;
      suggestedOrder?: string[];
    }[] = [];

    // Simple redundancy check: If two adjacent nodes use the same tool name
    const nodeIds = Array.from(graph.nodes.keys());
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const currentId = nodeIds[i];
      const nextId = nodeIds[i + 1];

      const currentTools = graph.nodes.get(currentId)?.tool_uses || [];
      const nextTools = graph.nodes.get(nextId)?.tool_uses || [];

      const currentToolNames = new Set(currentTools.map(t => t.name));
      const nextToolNames = new Set(nextTools.map(t => t.name));

      for (const name of currentToolNames) {
        if (nextToolNames.has(name)) {
          suggestions.push({
            type: "redundancy",
            description: `Tool '${name}' appears to be called sequentially in adjacent steps (${currentId} -> ${nextId}). Consider merging or verifying necessity.`,
          });
        }
      }
    }

    // Simple reordering heuristic (Placeholder for complex pathfinding)
    if (graph.edges.size > 0 && !this.costModel) {
      suggestions.push({
        type: "reordering",
        description: "Cost model unavailable. Cannot perform optimal path reordering analysis.",
      });
    } else if (this.costModel) {
      // In a real scenario, this would run Dijkstra/A* on the cost model
      suggestions.push({
        type: "reordering",
        description: "Potential execution order improvement detected based on cost model.",
        suggestedOrder: ["StartNode", "IntermediateNode", "EndNode"],
      });
    }

    return suggestions;
  }

  public analyze(): AnalysisReport {
    const structuralIssues: string[] = [];
    const resourceConflicts = this.detectResourceConflicts(this.graph);
    const optimizationSuggestions = this.analyzeOptimization(this.graph);

    // Structural check: Simple cycle detection (placeholder)
    // A proper implementation would use DFS/Tarjan's algorithm
    if (this.graph.edges.size > 10) {
      structuralIssues.push("Graph complexity suggests potential deep dependencies; manual review recommended.");
    }

    // Calculate a rudimentary score (e.g., based on number of unique tools used)
    const uniqueTools = new Set<string>();
    for (const node of this.graph.nodes.values()) {
      for (const toolUse of node.tool_uses) {
        uniqueTools.add(toolUse.name);
      }
    }
    const overallScore = Math.min(100, 50 + uniqueTools.size * 5);

    return {
      structuralIssues: structuralIssues,
      resourceConflicts: resourceConflicts,
      optimizationSuggestions: optimizationSuggestions,
      overallScore: overallScore,
    };
  }
}