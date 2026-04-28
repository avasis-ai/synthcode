import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkLatencyMs: number;
}

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export interface DependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  causality: "direct" | "indirect";
  timeRange: TimeRange;
  resourceImpact: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface TemporalGraphData {
  nodes: {
    id: string;
    type: "user" | "assistant" | "tool";
    content: string;
    timeRange: TimeRange;
    resourceUsage: ResourceMetrics;
    metadata: Record<string, unknown>;
  }[];
  edges: DependencyEdge[];
}

export interface VisualizationPayload {
  graphDefinition: string; // e.g., Mermaid syntax or D3 JSON structure
  metadata: {
    totalDurationMs: number;
    bottleneckNodeId: string | null;
    summary: string;
  };
}

export class ToolExecutionDependencyVisualizerV109 {
  private executionHistory: Array<ContentBlock>;

  constructor(history: Array<ContentBlock>) {
    this.executionHistory = history;
  }

  private extractNodeData(block: ContentBlock, index: number): {
    id: string;
    type: "user" | "assistant" | "tool";
    content: string;
    timeRange: TimeRange;
    resourceUsage: ResourceMetrics;
    metadata: Record<string, unknown>;
  } {
    const nodeId = `step_${index}`;
    let type: "user" | "assistant" | "tool";
    let content: string = "";
    let resourceUsage: ResourceMetrics = {
      cpuUsageMs: 0,
      memoryUsageBytes: 0,
      networkLatencyMs: 0,
    };
    let metadata: Record<string, unknown> = {};

    if (block.type === "text") {
      type = "user"; // Simplification: assuming initial text block is user input context
      content = (block as TextBlock).text;
      resourceUsage = { cpuUsageMs: 10, memoryUsageBytes: 1024, networkLatencyMs: 5 };
    } else if (block.type === "tool_use") {
      type = "tool";
      const toolUseBlock = block as ToolUseBlock;
      content = `Tool Call: ${toolUseBlock.name} with input: ${JSON.stringify(toolUseBlock.input)}`;
      resourceUsage = { cpuUsageMs: 50, memoryUsageBytes: 4096, networkLatencyMs: 50 };
      metadata["toolId"] = toolUseBlock.id;
    } else if (block.type === "thinking") {
      type = "assistant";
      const thinkingBlock = block as ThinkingBlock;
      content = `Thinking Process: ${thinkingBlock.thinking.substring(0, 50)}...`;
      resourceUsage = { cpuUsageMs: 20, memoryUsageBytes: 2048, networkLatencyMs: 10 };
      metadata["thinking"] = true;
    } else {
      // Fallback for other block types if necessary
      type = "assistant";
      content = "Unknown block type encountered.";
    }

    return {
      id: nodeId,
      type: type,
      content: content,
      timeRange: { startTime: Date.now() - (index * 1000), endTime: Date.now() - ((index - 1) * 1000) },
      resourceUsage: resourceUsage,
      metadata: metadata,
    };
  }

  private generateEdges(nodes: Array<{ id: string }>): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceId = nodes[i].id;
      const targetId = nodes[i + 1].id;
      edges.push({
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        causality: "direct",
        timeRange: {
          startTime: nodes[i].timeRange.endTime,
          endTime: nodes[i + 1].timeRange.endTime,
        },
        resourceImpact: {
          cpu: 10,
          memory: 500,
          network: 20,
        },
      });
    }
    return edges;
  }

  public visualize(): VisualizationPayload {
    const nodes: {
      id: string;
      type: "user" | "assistant" | "tool";
      content: string;
      timeRange: TimeRange;
      resourceUsage: ResourceMetrics;
      metadata: Record<string, unknown>;
    }[] = [];

    for (let i = 0; i < this.executionHistory.length; i++) {
      const block = this.executionHistory[i];
      const nodeData = this.extractNodeData(block, i);
      nodes.push(nodeData);
    }

    const edges = this.generateEdges(nodes);

    const graphData: TemporalGraphData = {
      nodes: nodes,
      edges: edges,
    };

    // --- Payload Generation ---
    let totalDurationMs = 0;
    if (nodes.length > 0) {
      totalDurationMs = nodes[nodes.length - 1].timeRange.endTime - nodes[0].timeRange.startTime;
    }

    let bottleneckNodeId: string | null = null;
    let maxResourceUsage = 0;

    for (const node of nodes) {
      const totalResource = node.resourceUsage.cpuUsageMs + node.resourceUsage.memoryUsageBytes + node.resourceUsage.networkLatencyMs;
      if (totalResource > maxResourceUsage) {
        maxResourceUsage = totalResource;
        bottleneckNodeId = node.id;
      }
    }

    const summary = `Visualization generated for ${nodes.length} steps. Total duration: ${totalDurationMs}ms. Potential bottleneck identified at ${bottleneckNodeId || 'N/A'}.`;

    // Placeholder for actual graph library syntax generation (e.g., Mermaid)
    const graphDefinition = `graph TD;
        A[Start] --> ${nodes.map(n => n.id).join(' --> ')}
        subgraph Execution Flow
            ${nodes.map((n, i) => `${n.id}["${n.type.toUpperCase()}: ${n.content.substring(0, 20)}..."]`).join('; ')}
        end`;

    return {
      graphDefinition: graphDefinition,
      metadata: {
        totalDurationMs: totalDurationMs,
        bottleneckNodeId: bottleneckNodeId,
        summary: summary,
      },
    };
  }
}