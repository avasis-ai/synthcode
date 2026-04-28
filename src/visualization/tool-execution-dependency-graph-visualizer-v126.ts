import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceProfile {
  resourceName: string;
  usage: number;
  timeWindow: { start: number; end: number };
}

export interface TimeWindow {
  start: number;
  end: number;
}

export interface NodeMetadata {
  timeWindow: TimeWindow;
  resourceUsage: ResourceProfile[];
}

export interface EdgeMetadata {
  timeWindow: TimeWindow;
  resourceUsage: ResourceProfile[];
}

export interface GraphPayload {
  nodes: {
    id: string;
    content: ContentBlock;
    metadata: NodeMetadata;
  }[];
  edges: {
    sourceId: string;
    targetId: string;
    metadata: EdgeMetadata;
  }[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private readonly visualizationHook: (payload: GraphPayload) => void;

  constructor(visualizationHook: (payload: GraphPayload) => void) {
    this.visualizationHook = visualizationHook;
  }

  public render(payload: GraphPayload): void {
    this.visualizationHook(payload);
  }
}