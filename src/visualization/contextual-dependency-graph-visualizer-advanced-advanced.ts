import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TemporalConstraint {
  start: number;
  end: number;
  severity: "low" | "medium" | "high";
}

export interface ResourceUsage {
  resourceId: string;
  usageLevel: number; // 0.0 to 1.0
  isCritical: boolean;
}

export interface CapabilityLink {
  sourceCapability: string;
  targetCapability: string;
  confidenceScore: number; // 0.0 to 1.0
}

export interface AdvancedEdgeMetadata {
  temporal: TemporalConstraint[];
  resources: ResourceUsage[];
  capabilities: CapabilityLink[];
}

export interface AdvancedNodeMetadata {
  nodeId: string;
  description: string;
  associatedResources: ResourceUsage[];
  temporalSpan: { start: number; end: number };
}

export interface VisualizationContext {
  nodes: Record<string, AdvancedNodeMetadata>;
  edges: Record<string, {
    sourceId: string;
    targetId: string;
    metadata: AdvancedEdgeMetadata;
  }>;
}

export class ContextualDependencyGraphVisualizerAdvancedAdvanced {
  private context: VisualizationContext;

  constructor(context: VisualizationContext) {
    this.context = context;
  }

  private calculateEdgeStyle(edgeKey: string): {
    strokeWidth: number;
    color: string;
    opacity: number;
  } {
    const edge = this.context.edges[edgeKey];
    if (!edge) {
      return { strokeWidth: 1, color: "#ccc", opacity: 0.5 };
    }

    const { temporal, resources, capabilities } = edge.metadata;

    // 1. Temporal Overlap Styling (Color Gradient)
    let maxOverlap = 0;
    let primaryColor = "#4a90e2"; // Default blue
    if (temporal.length > 0) {
      // Simple heuristic: use the highest severity for color
      const highestSeverity = temporal.reduce((max, t) => {
        if (t.severity === "high" && max !== "high") return "high";
        if (t.severity === "medium" && max !== "high") return "medium";
        return max;
      }, "low");

      if (highestSeverity === "high") {
        primaryColor = "#d0021b"; // Red for high conflict
      } else if (highestSeverity === "medium") {
        primaryColor = "#f5a623"; // Orange for medium conflict
      }
    }

    // 2. Resource Usage Styling (Stroke Width)
    const maxResourceUsage = resources.reduce((max, r) => Math.max(max, r.usageLevel), 0);
    const strokeWidth = 1 + (maxResourceUsage * 3); // Width between 1 and 4

    // 3. Capability Link Styling (Opacity/Secondary Style)
    const confidenceSum = capabilities.reduce((sum, c) => sum + c.confidenceScore, 0);
    const opacity = 0.5 + (Math.min(1, confidenceSum) * 0.5); // Opacity between 0.5 and 1.0

    return {
      strokeWidth: Math.max(1, Math.round(strokeWidth)),
      color: primaryColor,
      opacity: Math.min(1.0, opacity),
    };
  }

  private calculateNodeStyle(nodeId: string): {
    borderWidth: number;
    backgroundColor: string;
  } {
    const node = this.context.nodes[nodeId];
    if (!node) {
      return { borderWidth: 1, backgroundColor: "#eee" };
    }

    // Resource influence on node size/border
    const maxResource = node.associatedResources.reduce((max, r) => Math.max(max, r.usageLevel), 0);
    const borderWidth = 1 + (maxResource * 2);

    // Temporal influence on background color (e.g., warning if span is very long)
    const duration = node.temporalSpan.end - node.temporalSpan.start;
    let bgColor = "#ffffff";
    if (duration > 10000) { // Arbitrary large duration threshold
      bgColor = "#fff3cd"; // Yellowish warning
    }

    return { borderWidth: Math.max(1, Math.round(borderWidth)), backgroundColor: bgColor };
  }

  /**
   * Renders the entire graph structure, applying advanced styling based on context metadata.
   * @returns A structured object containing all calculated visual properties.
   */
  public renderGraph(): {
    nodeStyles: Record<string, { borderWidth: number; backgroundColor: string }>;
    edgeStyles: Record<string, {
      strokeWidth: number;
      color: string;
      opacity: number;
    }>;
  } {
    const nodeStyles: Record<string, { borderWidth: number; backgroundColor: string }> = {};
    const edgeStyles: Record<string, {
      strokeWidth: number;
      color: string;
      opacity: number;
    }> = {};

    for (const nodeId in this.context.nodes) {
      nodeStyles[nodeId] = this.calculateNodeStyle(nodeId);
    }

    for (const edgeKey in this.context.edges) {
      edgeStyles[edgeKey] = this.calculateEdgeStyle(edgeKey);
    }

    return { nodeStyles, edgeStyles };
  }
}