import {
  ToolExecutionRecord,
  GraphNode,
  DependencyGraph,
} from "./types";

export class ToolExecutionDependencyGraphVisualizerV1 {
  private records: ToolExecutionRecord[];

  constructor(records: ToolExecutionRecord[]) {
    this.records = records;
  }

  private buildGraphNodes(records: ToolExecutionRecord[]): GraphNode[] {
    const nodes: GraphNode[] = [];
    let previousOutput: string | null = null;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const node: GraphNode = {
        id: `${record.toolName}_${i}`,
        name: record.toolName,
        description: `Executed at step ${i}.`,
        input: record.input,
        output: record.output,
        dependencies: [],
      };

      if (previousOutput !== null) {
        node.dependencies.push({
          sourceId: `${records[i - 1].toolName}_${i - 1}`,
          targetId: node.id,
          dependencyType: "OutputToInput",
        });
      }

      nodes.push(node);
      previousOutput = record.output;
    }
    return nodes;
  }

  private buildDependencies(nodes: GraphNode[]): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        description: node.description,
        input: node.input,
        output: node.output,
        dependencies: node.dependencies,
      })),
      edges: []
    };

    // Since we are building a linear/simple DAG based on sequence,
    // we can derive edges from the dependencies already calculated in buildGraphNodes
    // but we must ensure we only list unique edges.
    const edgeSet = new Set<string>();
    const edges: { sourceId: string; targetId: string; type: string }[] = [];

    for (const node of nodes) {
      for (const dep of node.dependencies) {
        const edgeKey = `${dep.sourceId}->${dep.targetId}`;
        if (!edgeSet.has(edgeKey)) {
          edges.push({
            sourceId: dep.sourceId,
            targetId: dep.targetId,
            type: dep.dependencyType,
          });
          edgeSet.add(edgeKey);
        }
      }
    }

    graph.edges = edges;
    return graph;
  }

  /**
   * Visualizes the tool execution dependency graph as a simplified JSON structure.
   * @returns {DependencyGraph} The structured graph representation.
   */
  public visualize(): DependencyGraph {
    const nodes = this.buildGraphNodes(this.records);
    return this.buildDependencies(nodes);
  }
}