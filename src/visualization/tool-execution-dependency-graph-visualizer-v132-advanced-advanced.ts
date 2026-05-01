import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceUsage {
  resourceName: string;
  usageOverTime: { timeStep: number; value: number }[];
}

export interface TemporalConstraint {
  predecessorId: string;
  successorId: string;
  minDelay: number; // Minimum time difference required
  maxDelay: number; // Maximum time difference allowed
}

export interface AdvancedGraphNode {
  id: string;
  type: "tool_execution" | "user_input" | "system_state";
  metadata: Record<string, unknown>;
  resourceUsage?: ResourceUsage[];
  startTime: number;
  endTime: number;
}

export interface AdvancedGraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: "dependency" | "causality" | "temporal";
  constraints?: TemporalConstraint;
}

export interface AdvancedGraphPayload {
  nodes: AdvancedGraphNode[];
  edges: AdvancedGraphEdge[];
  globalContext: {
    startTime: number;
    endTime: number;
  };
}

export interface VisualizationConfig {
  showResourceUsage: boolean;
  resourceBudgetFilter?: {
    resourceName: string;
    maxUsage: number;
  }[];
  minPathDuration?: number;
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: AdvancedGraphPayload;
  private config: VisualizationConfig;

  constructor(payload: AdvancedGraphPayload, config: VisualizationConfig = {}) {
    this.payload = payload;
    this.config = {
      showResourceUsage: true,
      ...config,
    };
  }

  private filterNodes(nodes: AdvancedGraphNode[]): AdvancedGraphNode[] {
    if (!this.config.showResourceUsage) {
      return nodes;
    }

    if (this.config.resourceBudgetFilter && this.config.resourceBudgetFilter.length > 0) {
      return nodes.filter(node => {
        if (!node.resourceUsage) return true; // Assume no filter if usage is missing

        for (const filter of this.config.resourceBudgetFilter) {
          const usage = node.resourceUsage.find(ru => ru.resourceName === filter.resourceName);
          if (usage) {
            const maxUsage = Math.max(...usage.usageOverTime.map(p => p.value));
            if (maxUsage > filter.maxUsage) {
              return false; // Exceeds budget
            }
          }
        }
        return true;
      });
    }
    return nodes;
  }

  private filterEdges(edges: AdvancedGraphEdge[]): AdvancedGraphEdge[] {
    if (this.config.minPathDuration === undefined) {
      return edges;
    }

    // Simple edge filtering based on implied path duration (requires more context for perfect implementation)
    return edges.filter(edge => {
      const source = this.payload.nodes.find(n => n.id === edge.sourceId);
      const target = this.payload.nodes.find(n => n.id === edge.targetId);

      if (!source || !target) return true;

      const duration = target.startTime - source.endTime;
      return duration >= this.config.minPathDuration;
    });
  }

  public renderGraph(): { nodes: AdvancedGraphNode[]; edges: AdvancedGraphEdge[] } {
    const filteredNodes = this.filterNodes(this.payload.nodes);
    const filteredEdges = this.filterEdges(this.payload.edges);

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }
}