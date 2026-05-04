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

export interface ContextualDependencyPayload {
  messages: Message[];
  dependencies: {
    sourceId: string;
    targetId: string;
    type: "tool_call" | "context_change" | "temporal";
    contextDiff?: {
      stateKey: string;
      oldValue: any;
      newValue: any;
    } | null;
    resourceImpact?: {
      resource: string;
      usage: number;
      constraintViolated: boolean;
    } | null;
    timestampDeltaMs: number;
  }[];
}

export class ContextualDependencyGraphVisualizerV1 {
  private payload: ContextualDependencyPayload;

  constructor(payload: ContextualDependencyPayload) {
    this.payload = payload;
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    // 1. Visualize Messages (Nodes)
    this.payload.messages.forEach((message, index) => {
      const nodeId = `msg_${index}`;
      let nodeType: "message" = "generic";
      let title: string = "Message";

      if (message.role === "user") {
        nodeType = "user_input";
        title = "User Input";
      } else if (message.role === "assistant") {
        nodeType = "assistant_response";
        title = "Assistant Response";
      } else if (message.role === "tool") {
        nodeType = "tool_result";
        title = "Tool Result";
      }

      nodes.push({
        id: nodeId,
        label: `${message.role}: ${message.content.length > 0 ? "..." : ""}`,
        type: nodeType,
        details: message,
      });
    });

    // 2. Visualize Contextual Dependencies (Edges)
    this.payload.dependencies.forEach((dep, index) => {
      const edgeId = `dep_${index}`;
      let edgeType: "dependency" = "unknown";
      let description: string = "";

      if (dep.type === "tool_call") {
        edgeType = "tool_call";
        description = `Tool Call Dependency: ${dep.sourceId} -> ${dep.targetId}`;
      } else if (dep.type === "context_change") {
        edgeType = "context_change";
        description = `Context Change: ${dep.contextDiff?.stateKey || 'Unknown'} changed.`;
      } else if (dep.type === "temporal") {
        edgeType = "temporal";
        description = `Temporal Flow: ${dep.sourceId} to ${dep.targetId} over ${dep.timestampDeltaMs}ms.`;
      }

      const edge: any = {
        id: edgeId,
        source: dep.sourceId,
        target: dep.targetId,
        type: edgeType,
        label: description,
        contextualData: {
          contextDiff: dep.contextDiff,
          resourceImpact: dep.resourceImpact,
          timestampDeltaMs: dep.timestampDeltaMs,
        },
      };
      edges.push(edge);
    });

    return { nodes, edges };
  }
}