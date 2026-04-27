import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface DependencyGraph {
  nodes: Map<string, {
    toolCallId: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
  }>;
  edges: Map<string, {
    source: string;
    target: string;
    dataPath: string;
  }>;
}

export class ToolExecutionDependencyGraphBuilder {
  private graph: DependencyGraph;

  constructor() {
    this.graph = {
      nodes: new Map<string, {
        toolCallId: string;
        inputs: Record<string, string>;
        outputs: Record<string, string>;
      }>(),
      edges: new Map<string, {
        source: string;
        target: string;
        dataPath: string;
      }>(),
    };
  }

  public addToolCallNode(toolCallId: string, inputs: Record<string, string>, outputs: Record<string, string>): void {
    if (this.graph.nodes.has(toolCallId)) {
      return;
    }
    this.graph.nodes.set(toolCallId, {
      toolCallId,
      inputs,
      outputs,
    });
  }

  public addDependency(sourceToolCallId: string, targetToolCallId: string, dataPath: string): void {
    const edgeKey = `${sourceToolCallId}->${targetToolCallId}`;
    this.graph.edges.set(edgeKey, {
      source: sourceToolCallId,
      target: targetToolCallId,
      dataPath,
    });
  }

  private buildAdjacencyList(startNodeId: string): Map<string, Set<string>> {
    const adj: Map<string, Set<string>> = new Map();
    for (const [key, edge] of this.graph.edges.entries()) {
      if (edge.source === startNodeId) {
        if (!adj.has(edge.target)) {
          adj.set(edge.target, new Set());
        }
        adj.get(edge.target)!.add(key);
      }
    }
    return adj;
  }

  public resolveDependencies(startNodeId: string): DependencyGraph {
    const requiredNodes = new Set<string>();
    const queue: string[] = [startNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      requiredNodes.add(nodeId);

      const adjacency = this.buildAdjacencyList(nodeId);
      for (const neighbor of adjacency.keys()) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    const resolvedGraph: DependencyGraph = {
      nodes: new Map(
        Array.from(requiredNodes).map(
          (id) => [id, this.graph.nodes.get(id)!]
        )
      ),
      edges: new Map(),
    };

    for (const [key, edge] of this.graph.edges.entries()) {
      if (requiredNodes.has(edge.source) && requiredNodes.has(edge.target)) {
        resolvedGraph.edges.set(key, edge);
      }
    }

    return resolvedGraph;
  }
}