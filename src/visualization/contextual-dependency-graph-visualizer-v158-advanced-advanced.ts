import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraint {
  resourceId: string;
  requiredAmount: number;
  availableCapacity: number;
  violationSeverity: 'low' | 'medium' | 'high';
}

export interface TemporalRelationship {
  startTime: number;
  endTime: number;
  duration: number;
  overlapSeverity: 'none' | 'minor' | 'major';
}

export interface CapabilityLink {
  sourceCapability: string;
  targetCapability: string;
  requiredLevel: number;
  actualLevel: number;
}

export interface GraphNode {
  id: string;
  label: string;
  metadata: {
    [key: string]: any;
  };
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  metadata: {
    [key: string]: any;
  };
  constraints?: ResourceConstraint[];
  temporal?: TemporalRelationship[];
  capabilities?: CapabilityLink[];
}

export interface ContextualGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConstraintVisualizationConfig {
  showResourceConstraints: boolean;
  showTemporalRelationships: boolean;
  showCapabilityLinks: boolean;
  maxConstraintDepth: number;
}

export class ContextualDependencyGraphVisualizer {
  private payload: ContextualGraphPayload;
  private config: ConstraintVisualizationConfig;

  constructor(payload: ContextualGraphPayload, config: ConstraintVisualizationConfig) {
    this.payload = payload;
    this.config = config;
  }

  private _processNode(node: GraphNode): any {
    return {
      id: node.id,
      label: node.label,
      visualStyle: {
        baseColor: '#3498db',
        size: 15,
        // Placeholder for advanced node styling based on metadata
        metadataIndicators: this._analyzeNodeMetadata(node.metadata),
      },
    };
  }

  private _processEdge(edge: GraphEdge): any {
    const processedEdge: any = {
      source: edge.sourceId,
      target: edge.targetId,
      visualStyle: {
        baseColor: '#95a5a6',
        thickness: 2,
        // Placeholder for advanced edge styling
        metadataIndicators: this._analyzeEdgeMetadata(edge.metadata),
      },
      // Constraint visualization logic
      constraints: this._processConstraints(edge),
      // Temporal visualization logic
      temporal: this._processTemporal(edge),
      // Capability visualization logic
      capabilities: this._processCapabilities(edge),
    };
    return processedEdge;
  }

  private _analyzeNodeMetadata(metadata: { [key: string]: any }): any {
    if (metadata.riskScore && metadata.riskScore > 0.8) {
      return { warning: true, indicator: 'High Risk' };
    }
    return {};
  }

  private _analyzeEdgeMetadata(metadata: { [key: string]: any }): any {
    if (metadata.type === 'critical') {
      return { typeIndicator: 'CRIT' };
    }
    return {};
  }

  private _processConstraints(edge: GraphEdge): any {
    if (!this.config.showResourceConstraints || !edge.constraints || edge.constraints.length === 0) {
      return null;
    }

    const violations = edge.constraints.filter(c =>
      c.violationSeverity !== 'none'
    );

    if (violations.length === 0) {
      return { type: 'resource', violations: [] };
    }

    return {
      type: 'resource',
      violations: violations.map(v => ({
        resourceId: v.resourceId,
        severity: v.violationSeverity,
        visualCue: v.violationSeverity === 'high' ? 'dashed-red' : 'dashed-orange',
      })),
    };
  }

  private _processTemporal(edge: GraphEdge): any {
    if (!this.config.showTemporalRelationships || !edge.temporal || edge.temporal.length === 0) {
      return null;
    }

    const overlaps = edge.temporal.filter(t =>
      t.overlapSeverity !== 'none'
    );

    if (overlaps.length === 0) {
      return { type: 'temporal', overlaps: [] };
    }

    return {
      type: 'temporal',
      overlaps: overlaps.map(t => ({
        severity: t.overlapSeverity,
        visualCue: t.overlapSeverity === 'major' ? 'overlay-red' : 'overlay-yellow',
      })),
    };
  }

  private _processCapabilities(edge: GraphEdge): any {
    if (!this.config.showCapabilityLinks || !edge.capabilities || edge.capabilities.length === 0) {
      return null;
    }

    const deficits = edge.capabilities.filter(c =>
      c.requiredLevel > c.actualLevel
    );

    if (deficits.length === 0) {
      return { type: 'capability', deficits: [] };
    }

    return {
      type: 'capability',
      deficits: deficits.map(c => ({
        source: c.sourceCapability,
        target: c.targetCapability,
        deficit: c.requiredLevel - c.actualLevel,
        visualCue: 'dimmed-blue',
      })),
    };
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const processedNodes = this.payload.nodes.map(this._processNode);
    const processedEdges = this.payload.edges.map(this._processEdge);

    return {
      nodes: processedNodes,
      edges: processedEdges,
    };
  }
}