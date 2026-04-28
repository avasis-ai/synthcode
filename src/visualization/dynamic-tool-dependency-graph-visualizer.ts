import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export interface DynamicDependencyMetadata {
  sourceToolId: string;
  targetToolId: string;
  dependencyType: "runtime" | "implicit" | "conditional";
  metadata: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface VisualizationContext {
  graphData: GraphData;
  dynamicMetadata: DynamicDependencyMetadata[];
}

export class DynamicToolDependencyGraphVisualizer {
  private context: VisualizationContext;

  constructor(context: VisualizationContext) {
    this.context = context;
  }

  private resolveDynamicEdges(metadata: DynamicDependencyMetadata[]): GraphEdge[] {
    return metadata.map(meta => ({
      source: meta.sourceToolId,
      target: meta.targetToolId,
      weight: 1.0, // Default weight for dynamic edges
    }));
  }

  private mergeNodes(existingNodes: GraphNode[], metadata: DynamicDependencyMetadata[]): GraphNode[] {
    const nodeMap = new Map<string, GraphNode>(
      existingNodes.map(node => [node.id, node])
    );

    const uniqueSources = new Set<string>();
    const uniqueTargets = new Set<string>();

    metadata.forEach(meta => {
      uniqueSources.add(meta.sourceToolId);
      uniqueTargets.add(meta.targetToolId);
    });

    const newNodes: GraphNode[] = [];
    const addedIds = new Set<string>();

    // Add existing nodes
    existingNodes.forEach(node => {
      newNodes.push(node);
      addedIds.add(node.id);
    });

    // Add nodes derived from dynamic metadata if they don't exist
    [...uniqueSources].forEach(id => {
      if (!addedIds.has(id)) {
        newNodes.push({
          id: id,
          label: `Tool: ${id}`,
          position: { x: 0, y: 0 }, // Placeholder position
        });
        addedIds.add(id);
      }
    });

    [...uniqueTargets].forEach(id => {
      if (!addedIds.has(id)) {
        newNodes.push({
          id: id,
          label: `Tool: ${id}`,
          position: { x: 0, y: 0 }, // Placeholder position
        });
        addedIds.add(id);
      }
    });

    return newNodes;
  }

  public visualize(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const { graphData, dynamicMetadata } = this.context;

    // 1. Merge Nodes: Incorporate tools mentioned in dynamic metadata
    const mergedNodes = this.mergeNodes(graphData.nodes, dynamicMetadata);

    // 2. Merge Edges: Combine static and dynamic edges
    const dynamicEdges = this.resolveDynamicEdges(dynamicMetadata);

    // Simple union of edges (assuming dynamic edges are additive)
    const allEdges: GraphEdge[] = [...graphData.edges, ...dynamicEdges];

    return {
      nodes: mergedNodes,
      edges: allEdges,
    };
  }
}