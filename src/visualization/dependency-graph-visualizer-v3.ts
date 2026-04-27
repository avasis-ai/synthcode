import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type DependencyGraph = Map<string, {
  dependencies: Set<string>;
  metadata: Record<string, any>;
}>;

export interface DependencyEdge {
  source: string;
  target: string;
  type: string;
  metadata: Record<string, any>;
}

export interface GraphContext {
  activeFilters: Set<string>;
  visibleDependencyTypes: Set<string>;
  rootNodes: Set<string>;
}

export class DependencyGraphVisualizerV3 {
  private graph: DependencyGraph;
  private edges: DependencyEdge[];

  constructor(graph: DependencyGraph, edges: DependencyEdge[]) {
    this.graph = graph;
    this.edges = edges;
  }

  private detectCycles(nodes: Set<string>, edges: DependencyEdge[]): Set<string>[] {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const cycles: Set<string>[] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const edge of edges.filter(e => e.source === node)) {
        if (!visited.has(edge.target)) {
          dfs(edge.target, path);
        } else if (recursionStack.has(edge.target)) {
          // Cycle detected
          const cycleStart = path.indexOf(edge.target);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart)] as string[]);
          }
        }
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    return cycles;
  }

  private filterGraph(context: GraphContext): {
    filteredNodes: Set<string>;
    filteredEdges: DependencyEdge[];
    cycles: Set<string>[];
  } {
    const filteredNodes: Set<string> = new Set();
    const filteredEdges: DependencyEdge[] = [];
    const allNodes = new Set(this.graph.keys());

    // 1. Node Filtering (Implicitly handled by edge filtering, but good for explicit root visibility)
    const visibleNodes = new Set<string>();
    for (const node of allNodes) {
      let isVisible = true;
      if (context.activeFilters.size > 0) {
        const nodeMetadata = this.graph.get(node)?.metadata || {};
        let matchesFilter = false;
        for (const filterTag of context.activeFilters) {
          if (nodeMetadata[filterTag] === true) {
            matchesFilter = true;
            break;
          }
        }
        isVisible = matchesFilter;
      }
      if (context.rootNodes.has(node) || isVisible) {
        visibleNodes.add(node);
      }
    }

    // 2. Edge Filtering
    for (const edge of this.edges) {
      let passesFilter = true;

      // Check source/target visibility based on active filters
      const sourceMeta = this.graph.get(edge.source)?.metadata || {};
      const targetMeta = this.graph.get(edge.target)?.metadata || {};

      for (const filterTag of context.activeFilters) {
        const sourceVisible = sourceMeta[filterTag] === true;
        const targetVisible = targetMeta[filterTag] === true;
        const edgeVisible = edge.metadata[filterTag] === true;

        if (!sourceVisible || !targetVisible || !edgeVisible) {
          passesFilter = false;
          break;
        }
      }

      // Check dependency type visibility
      if (!context.visibleDependencyTypes.has(edge.type)) {
        passesFilter = false;
      }

      if (passesFilter) {
        filteredEdges.push(edge);
        visibleNodes.add(edge.source);
        visibleNodes.add(edge.target);
      }
    }

    // 3. Cycle Detection on Filtered Graph (Simplified: Run on all edges, but only report cycles involving visible nodes)
    const cycles = this.detectCycles(visibleNodes, filteredEdges);

    return {
      filteredNodes: visibleNodes,
      filteredEdges: filteredEdges,
      cycles: cycles,
    };
  }

  public render(context: GraphContext): {
    visualizationData: {
      nodes: Record<string, any>;
      edges: DependencyEdge[];
      cycles: Set<string>[];
    };
    message: TextBlock;
  } {
    const { filteredNodes, filteredEdges, cycles } = this.filterGraph(context);

    const nodes: Record<string, any> = {};
    for (const nodeName of filteredNodes) {
      const nodeData = this.graph.get(nodeName);
      nodes[nodeName] = {
        id: nodeName,
        metadata: nodeData?.metadata || {},
        isCycleMember: cycles.some(cycle => cycle.includes(nodeName)),
      };
    }

    const visualizationData = {
      nodes: nodes,
      edges: filteredEdges,
      cycles: cycles,
    };

    const message: TextBlock = {
      type: "text",
      text: `Visualization rendered successfully. Nodes: ${Object.keys(nodes).length}, Edges: ${filteredEdges.length}. Cycles detected: ${cycles.length}.`,
    };

    return {
      visualizationData,
      message,
    };
  }
}