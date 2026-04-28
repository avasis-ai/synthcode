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

export interface NodeData {
  id: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface EdgeData {
  source: string;
  target: string;
  metadata: {
    resource_constraints?: Record<string, { required: number; available: number }>;
    temporal_relationship?: {
      latency_ms: number;
      precedes_step: boolean;
    };
  };
}

export interface DependencyGraphPayload {
  nodes: NodeData[];
  edges: EdgeData[];
}

export class ToolExecutionDependencyGraphVisualizerV121 {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public visualize(): {
    nodes: any[];
    edges: any[];
    styles: {
      nodeBadgeStyles: Record<string, string>;
      edgeOverlayStyles: Record<string, string>;
    };
  } {
    const nodes = this.payload.nodes.map((node) => {
      let badgeStyle = "";
      if (node.metadata.resource_constraints) {
        badgeStyle = `Resource: ${Object.keys(node.metadata.resource_constraints).join(', ')}`;
      } else if (node.metadata.temporal_relationship) {
        badgeStyle = `Time: ${node.metadata.temporal_relationship.latency_ms}ms`;
      }
      return {
        id: node.id,
        label: node.label,
        badge: badgeStyle,
        metadata: node.metadata,
      };
    });

    const edges = this.payload.edges.map((edge) => {
      let overlayStyle = "";
      let hasConstraint = false;
      let hasTemporal = false;

      if (edge.metadata.resource_constraints) {
        overlayStyle += "Resource Constraint | ";
        hasConstraint = true;
      }
      if (edge.metadata.temporal_relationship) {
        overlayStyle += "Temporal Link | ";
        hasTemporal = true;
      }

      return {
        source: edge.source,
        target: edge.target,
        overlay: overlayStyle.trim(),
        metadata: edge.metadata,
        isComplex: hasConstraint || hasTemporal,
      };
    });

    const styles = {
      nodeBadgeStyles: this.generateNodeBadgeStyles(nodes),
      edgeOverlayStyles: this.generateEdgeOverlayStyles(edges),
    };

    return {
      nodes,
      edges,
      styles,
    };
  }

  private generateNodeBadgeStyles(nodes: any[]): Record<string, string> {
    const styles: Record<string, string> = {};
    nodes.forEach((node) => {
      if (node.badge) {
        styles[node.id] = `badge-${node.badge.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      } else {
        styles[node.id] = "badge-default";
      }
    });
    return styles;
  }

  private generateEdgeOverlayStyles(edges: any[]): Record<string, string> {
    const styles: Record<string, string> = {};
    edges.forEach((edge) => {
      if (edge.isComplex) {
        styles[`${edge.source}-${edge.target}`] = "overlay-complex";
      } else {
        styles[`${edge.source}-${edge.target}`] = "overlay-simple";
      }
    });
    return styles;
  }
}