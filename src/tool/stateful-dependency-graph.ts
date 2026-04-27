import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolInvocationRecord {
  tool_name: string;
  tool_input: Record<string, unknown>;
  invocation_id: string;
  timestamp: number;
}

export interface DependencyNode {
  sourceInvocationId: string;
  targetToolName: string;
  reasoningContext: string;
  dependencyType: "FULFILLS" | "CONTRADICTS" | "EXTENDS";
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  history: ToolInvocationRecord[];
}

export class StatefulDependencyGraph {
  private graph: DependencyGraph;

  constructor(initialGraph: DependencyGraph = {
    nodes: new Map(),
    history: [],
  }) {
    this.graph = initialGraph;
  }

  private getLatestInvocationId(): string | undefined {
    if (this.graph.history.length === 0) {
      return undefined;
    }
    return this.graph.history[this.graph.history.length - 1].invocation_id;
  }

  public processInvocation(
    newInvocation: ToolInvocationRecord,
    reasoningContext: string
  ): DependencyGraph {
    const newGraph = {
      nodes: new Map(this.graph.nodes),
      history: [...this.graph.history, newInvocation],
    };

    const latestId = this.getLatestInvocationId();
    const newNodes = new Map<string, DependencyNode>();

    if (latestId) {
      const newDependencyKey = `${latestId}_to_${newInvocation.tool_name}`;
      const newNode: DependencyNode = {
        sourceInvocationId: latestId,
        targetToolName: newInvocation.tool_name,
        reasoningContext: reasoningContext,
        dependencyType: this.determineDependencyType(
          latestId,
          newInvocation.tool_name,
          reasoningContext
        ),
      };
      newNodes.set(newDependencyKey, newNode);
    }

    for (const [key, node] of this.graph.nodes.entries()) {
      newNodes.set(key, node);
    }

    for (const [key, node] of newNodes.entries()) {
      if (!this.graph.nodes.has(key)) {
        newGraph.nodes.set(key, node);
      }
    }

    this.graph = newGraph;
    return this.graph;
  }

  private determineDependencyType(
    sourceId: string,
    targetToolName: string,
    context: string
  ): DependencyNode["dependencyType"] {
    if (context.toLowerCase().includes("fulfills")) {
      return "FULFILLS";
    }
    if (context.toLowerCase().includes("contradicts")) {
      return "CONTRADICTS";
    }
    return "EXTENDS";
  }

  public serialize(): {
    nodes: Record<string, DependencyNode>;
    history: ToolInvocationRecord[];
  } {
    return {
      nodes: Object.fromEntries(this.graph.nodes),
      history: this.graph.history,
    };
  }

  public static deserialize(serializedGraph: {
    nodes: Record<string, DependencyNode>;
    history: ToolInvocationRecord[];
  }): StatefulDependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(Object.entries(serializedGraph.nodes)),
      history: serializedGraph.history,
    };
    return new StatefulDependencyGraph(graph);
  }
}