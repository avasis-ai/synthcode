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

export interface TemporalConstraint {
  start?: number;
  end?: number;
}

export interface ResourceConstraint {
  resourceName: string;
  minUsage: number;
  maxUsage: number;
}

export interface CapabilityLink {
  capability: string;
  level: 'basic' | 'advanced' | 'expert';
}

export interface AdvancedNodeMetadata {
  resourceCost: number;
  temporalConstraints: TemporalConstraint[];
  capabilities: CapabilityLink[];
}

export interface AdvancedEdgeMetadata {
  dependencyType: 'direct' | 'indirect' | 'causal';
  resourceUsageEstimate: {
    resourceName: string;
    estimate: number;
  }[];
  violationSeverity: 'low' | 'medium' | 'high';
}

export interface GraphNode {
  id: string;
  label: string;
  metadata: AdvancedNodeMetadata;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  metadata: AdvancedEdgeMetadata;
}

export interface ContextualDependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ContextualDependencyGraphVisualizer {
  private graphData: ContextualDependencyGraph;

  constructor(graphData: ContextualDependencyGraph) {
    this.graphData = graphData;
  }

  private calculateNodeVisualProperties(node: GraphNode): { size: number; color: string } {
    const cost = node.metadata.resourceCost;
    const size = Math.max(10, 15 + Math.min(50, cost * 2));
    let color: string = 'hsl(200, 70%, 60%)';

    if (node.metadata.temporalConstraints.some(c => c.end && c.end < Date.now() - 10000)) {
      color = 'hsl(0, 80%, 50%)'; // Red for expired
    } else if (cost > 30) {
      color = 'hsl(10, 80%, 50%)'; // Orange for high cost
    }

    return { size, color };
  }

  private calculateEdgeVisualProperties(edge: GraphEdge): { strokeWidth: number; strokeColor: string } {
    const severity = edge.metadata.violationSeverity;
    let width: number = 1;
    let color: string = 'hsl(120, 70%, 60%)';

    if (severity === 'high') {
      width = 3;
      color = 'red';
    } else if (severity === 'medium') {
      width = 2;
      color = 'orange';
    }

    return { strokeWidth: width, strokeColor: color };
  }

  public renderVisualization(): { nodes: { id: string; style: { size: number; color: string } }[]; edges: { source: string; target: string; style: { strokeWidth: number; strokeColor: string } }[] } {
    const nodeStyles = this.graphData.nodes.map(node => ({
      id: node.id,
      style: this.calculateNodeVisualProperties(node),
    }));

    const edgeStyles = this.graphData.edges.map(edge => ({
      source: edge.sourceId,
      target: edge.targetId,
      style: this.calculateEdgeVisualProperties(edge),
    }));

    return { nodes: nodeStyles, edges: edgeStyles };
  }

  public processContextualUpdate(
    currentGraph: ContextualDependencyGraph,
    newMetadata: Partial<ContextualDependencyGraph>
  ): ContextualDependencyGraph {
    const updatedNodes = currentGraph.nodes.map(node => {
      const updatedNode = { ...node };
      if (newMetadata.nodes && newMetadata.nodes.some(n => n.id === node.id)) {
        const newMeta = newMetadata.nodes.find(n => n.id === node.id)!.metadata;
        updatedNode.metadata = {
          ...node.metadata,
          ...(newMeta as Partial<AdvancedNodeMetadata>)
        };
      }
      return updatedNode;
    });

    const updatedEdges = currentGraph.edges.map(edge => {
      const updatedEdge = { ...edge };
      if (newMetadata.edges && newMetadata.edges.some(e => e.sourceId === edge.sourceId && e.targetId === edge.targetId)) {
        const newMeta = newMetadata.edges.find(e => e.sourceId === edge.sourceId && e.targetId === edge.targetId)!.metadata;
        updatedEdge.metadata = {
          ...edge.metadata,
          ...(newMeta as Partial<AdvancedEdgeMetadata>)
        };
      }
      return updatedEdge;
    });

    return {
      nodes: updatedNodes,
      edges: updatedEdges,
    };
  }
}