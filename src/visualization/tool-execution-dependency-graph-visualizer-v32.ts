import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; result: string };

export interface VisualizationPayload {
  nodes: {
    id: string;
    label: string;
    type: "tool" | "user" | "assistant";
    startTime: number;
    endTime: number;
    resourceUsage: Record<string, number>;
  }[];
  edges: {
    sourceId: string;
    targetId: string;
    dependencyType: "data_flow" | "control_flow";
    weight: number;
    latencyMs: number;
  }[];
  timelineEvents: LoopEvent[];
}

export class ToolExecutionDependencyGraphVisualizerV32 {
  private payload: VisualizationPayload | null = null;

  constructor() {}

  public processGraphData(payload: VisualizationPayload): void {
    this.payload = payload;
  }

  public renderGraph(): string {
    if (!this.payload) {
      return "Error: Visualization payload not set. Call processGraphData first.";
    }

    const { nodes, edges, timelineEvents } = this.payload;

    let mermaidGraph = "graph TD;\n";

    // 1. Define Nodes with temporal/resource context
    nodes.forEach(node => {
      const resourceInfo = Object.entries(node.resourceUsage)
        .map(([res, usage]) => `${res}:${usage}`)
        .join(", ");
      mermaidGraph += `  ${node.id}["${node.label} (Time: ${node.startTime}-${node.endTime}, Resources: ${resourceInfo})"]\n`;
    });

    // 2. Define Edges with flow/latency context
    edges.forEach(edge => {
      let dependencyStyle = "";
      if (edge.dependencyType === "data_flow") {
        dependencyStyle = ` -- Data Flow (Weight: ${edge.weight}) --> `;
      } else {
        dependencyStyle = ` -- Control Flow (Latency: ${edge.latencyMs}ms) --> `;
      }
      mermaidGraph += `  ${edge.sourceId} ${dependencyStyle} ${edge.targetId};\n`;
    });

    // 3. Incorporate Timeline Events (Conceptual representation)
    let timelineSection = "\n%% Timeline Events (Conceptual):\n";
    timelineEvents.forEach((event, index) => {
      let eventLabel = "";
      if ("text" in event) {
        eventLabel = `[${index + 1}] Text: ${event.text}`;
      } else if ("thinking" in event) {
        eventLabel = `[${index + 1}] Thinking: ${event.thinking}`;
      } else if ("result" in event) {
        eventLabel = `[${index + 1}] Tool Result: ${event.result}`;
      }
      timelineSection += `  ${eventLabel}\n`;
    });

    return `%% Mermaid Graph Definition for Tool Execution Dependency Graph V3.2\n${mermaidGraph}${timelineSection}`;
  }
}