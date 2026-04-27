import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ToolExecutionRecord = {
  toolName: string;
  startTime: number;
  endTime: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export interface GraphNode {
  id: string;
  toolName: string;
  startTime: number;
  endTime: number;
  duration: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  dependencyType: "causal" | "temporal";
  weight: number;
}

export class ToolExecutionDependencyGraphVisualizerV29 {
  private records: ToolExecutionRecord[];

  constructor(records: ToolExecutionRecord[]) {
    this.records = records;
  }

  private buildNodes(records: ToolExecutionRecord[]): GraphNode[] {
    return records.map((record, index) => ({
      id: `tool_${index}`,
      toolName: record.toolName,
      startTime: record.startTime,
      endTime: record.endTime,
      duration: record.endTime - record.startTime,
      input: record.input,
      output: record.output,
    }));
  }

  private buildEdges(nodes: GraphNode[]): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i];
        const target = nodes[j];

        // Causal dependency: If one tool's output is used as another's input
        // (Simplified check for demonstration)
        const isCausal = Object.keys(source.output).some(
          key =>
            typeof (source.output[key]) === "string" &&
            target.input[key] !== undefined &&
            (source.output[key] as string).includes(
              String(target.input[key]!)
            )
        );

        if (isCausal) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            dependencyType: "causal",
            weight: 1.0,
          });
        }

        // Temporal dependency: If they overlap or are sequential
        const overlap = Math.max(0, Math.min(source.endTime, target.endTime) - Math.max(source.startTime, target.startTime));
        if (overlap > 0) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            dependencyType: "temporal",
            weight: overlap / 1000,
          });
        }
      }
    }
    return edges;
  }

  public visualize(
    timeWindowStart: number,
    timeWindowEnd: number
  ): { nodes: GraphNode[]; edges: DependencyEdge[] } {
    const allNodes = this.buildNodes(this.records);

    const filteredNodes = allNodes.filter(
      (node) =>
        node.startTime < timeWindowEnd &&
        node.endTime > timeWindowStart
    );

    const filteredEdges: DependencyEdge[] = [];
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const source = allNodes[i];
        const target = allNodes[j];

        // Re-evaluate edges based on time window intersection
        const sourceInWindow = source.startTime < timeWindowEnd && source.endTime > timeWindowStart;
        const targetInWindow = target.startTime < timeWindowEnd && target.endTime > timeWindowStart;

        if (sourceInWindow && targetInWindow) {
          const isCausal = Object.keys(source.output).some(
            key =>
              typeof (source.output[key]) === "string" &&
              target.input[key] !== undefined &&
              (source.output[key] as string).includes(
                String(target.input[key]!)
              )
          );

          if (isCausal) {
            filteredEdges.push({
              sourceId: source.id,
              targetId: target.id,
              dependencyType: "causal",
              weight: 1.0,
            });
          }

          const overlap = Math.max(0, Math.min(source.endTime, target.endTime) - Math.max(source.startTime, target.startTime));
          if (overlap > 0) {
            filteredEdges.push({
              sourceId: source.id,
              targetId: target.id,
              dependencyType: "temporal",
              weight: overlap / 1000,
            });
          }
        }
      }
    }

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }
}