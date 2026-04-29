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

interface ResourceConstraint {
  resourceId: string;
  usageAmount: number;
  unit: string;
}

interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

interface NodePayload {
  baseMessage: Message;
  temporalConstraints?: TemporalConstraint[];
  resourceConstraints?: ResourceConstraint[];
}

interface EdgePayload {
  sourceId: string;
  targetId: string;
  temporalConstraints?: TemporalConstraint[];
  resourceConstraints?: ResourceConstraint[];
}

interface ContextGraphData {
  nodes: Record<string, NodePayload>;
  edges: EdgePayload[];
}

export class ContextualDependencyGraphVisualizer {
  private graphData: ContextGraphData;

  constructor(data: ContextGraphData) {
    this.graphData = data;
  }

  private _processNodePayload(nodeId: string): string {
    const payload = this.graphData.nodes[nodeId];
    if (!payload) return "";

    let visualization = `Node ${nodeId} (${payload.baseMessage.role}): `;

    if (payload.temporalConstraints && payload.temporalConstraints.length > 0) {
      visualization += `[Time: ${payload.temporalConstraints.map(t => `${t.startTimeMs}-${t.endTimeMs}`).join(", "")}] `;
    }

    if (payload.resourceConstraints && payload.resourceConstraints.length > 0) {
      const resourceStr = payload.resourceConstraints.map(r => `${r.resourceId}:${r.usageAmount}${r.unit}`).join(", ");
      visualization += `[Resources: ${resourceStr}] `;
    }

    return visualization;
  }

  private _processEdgePayload(edge: EdgePayload): string {
    let visualization = `Edge ${edge.sourceId} -> ${edge.targetId}: `;

    if (edge.temporalConstraints && edge.temporalConstraints.length > 0) {
      const timeStr = edge.temporalConstraints.map(t => `${t.startTimeMs}-${t.endTimeMs}`).join(", ");
      visualization += `[Time: ${timeStr}] `;
    }

    if (edge.resourceConstraints && edge.resourceConstraints.length > 0) {
      const resourceStr = edge.resourceConstraints.map(r => `${r.resourceId}:${r.usageAmount}${r.unit}`).join(", ");
      visualization += `[Resources: ${resourceStr}] `;
    }

    return visualization;
  }

  public visualizeGraph(): { nodes: string[]; edges: string[] } {
    const nodeOutputs: string[] = [];
    for (const nodeId in this.graphData.nodes) {
      nodeOutputs.push(this._processNodePayload(nodeId));
    }

    const edgeOutputs: string[] = [];
    for (const edge of this.graphData.edges) {
      edgeOutputs.push(this._processEdgePayload(edge));
    }

    return { nodes: nodeOutputs, edges: edgeOutputs };
  }
}