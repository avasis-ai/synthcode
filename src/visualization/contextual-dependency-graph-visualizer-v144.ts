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

export interface TemporalConstraintEdge {
  sourceId: string;
  targetId: string;
  resource: string;
  minTimeMs: number;
  maxTimeMs: number;
  violationSeverity: 'low' | 'medium' | 'high';
}

export interface GraphNode {
  id: string;
  type: 'message' | 'tool_call' | 'context';
  label: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: 'direct_flow' | 'dependency';
  weight: number;
}

export interface ContextualDependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  temporalConstraints: TemporalConstraintEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private payload: ContextualDependencyGraphPayload;

  constructor(payload: ContextualDependencyGraphPayload) {
    this.payload = payload;
  }

  public getNodes(): GraphNode[] {
    return this.payload.nodes;
  }

  public getEdges(): GraphEdge[] {
    return this.payload.edges;
  }

  public getTemporalConstraints(): TemporalConstraintEdge[] {
    return this.payload.temporalConstraints;
  }

  private getConstraintStyle(constraint: TemporalConstraintEdge): { color: string; thickness: number } {
    switch (constraint.violationSeverity) {
      case 'low':
        return { color: '#ffc107', thickness: 1 };
      case 'medium':
        return { color: '#ff9800', thickness: 2 };
      case 'high':
        return { color: '#f44336', thickness: 3 };
      default:
        return { color: '#9e9e9e', thickness: 1 };
    }
  }

  public renderVisualization(): { nodes: any[]; edges: any[]; constraints: any[] } {
    const nodes = this.getNodes();
    const edges = this.getEdges();
    const constraints = this.getTemporalConstraints();

    const styledConstraints = constraints.map(constraint => {
      const style = this.getConstraintStyle(constraint);
      return {
        ...constraint,
        style: style,
      };
    });

    return {
      nodes: nodes,
      edges: edges,
      constraints: styledConstraints,
    };
  }
}