import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface DataSchema {
  name: string;
  fields: Record<string, { type: string; required: boolean }>;
}

export interface DependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  dataFlow: {
    schema: DataSchema;
    transformation: string;
  };
  failurePotential: boolean;
}

export interface GraphNode {
  id: string;
  type: "tool" | "step";
  name: string;
  description: string;
  inputSchema?: DataSchema;
  outputSchema?: DataSchema;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class DependencyGraphVisualizerV2 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private validateSchema(schema: DataSchema | undefined): boolean {
    return !!schema && Object.keys(schema.fields).length > 0;
  }

  public getGraph(): DependencyGraph {
    return this.graph;
  }

  public visualize(): {
    nodes: GraphNode[];
    edges: DependencyEdge[];
    dataFlowDetails: Record<string, { source: string; target: string; schema: DataSchema; transformation: string }>;
  } {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;

    const dataFlowDetails: Record<string, { source: string; target: string; schema: DataSchema; transformation: string }> = {};

    for (const edge of edges) {
      const key = `${edge.sourceNodeId}->${edge.targetNodeId}`;
      dataFlowDetails[key] = {
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        schema: edge.dataFlow.schema,
        transformation: edge.dataFlow.transformation,
      };
    }

    return {
      nodes: nodes,
      edges: edges,
      dataFlowDetails: dataFlowDetails,
    };
  }

  public analyzeFailurePoints(): {
    potentialFailures: Array<{ nodeId: string; reason: string }>;
    criticalPaths: Array<{ path: string; riskScore: number }>;
  } {
    const potentialFailures: Array<{ nodeId: string; reason: string }> = [];
    const criticalPaths: Array<{ path: string; riskScore: number }> = [];

    for (const node of this.graph.nodes) {
      if (node.type === "tool" && node.name.toLowerCase().includes("external")) {
        potentialFailures.push({
          nodeId: node.id,
          reason: "External tool dependency detected; network or API failure risk.",
        });
      }
    }

    // Simple path analysis based on edges
    const paths: Record<string, { path: string; risk: number }> = {};

    for (const edge of this.graph.edges) {
      const pathKey = `${edge.sourceNodeId}->${edge.targetNodeId}`;
      const risk = edge.failurePotential ? 0.8 : 0.2;

      if (!paths[pathKey]) {
        paths[pathKey] = { path: pathKey, risk: risk };
      } else {
        paths[pathKey].risk += risk;
      }
    }

    // In a real scenario, this would involve complex graph traversal (e.g., Dijkstra's)
    // For this implementation, we just return the aggregated edge risks.
    for (const key in paths) {
      criticalPaths.push({
        path: key,
        riskScore: paths[key].risk,
      });
    }

    return {
      potentialFailures: potentialFailures,
      criticalPaths: criticalPaths.sort((a, b) => b.riskScore - a.riskScore),
    };
  }
}