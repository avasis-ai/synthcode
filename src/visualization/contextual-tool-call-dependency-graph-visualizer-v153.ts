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

export type ContextualDependencyPayload = {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    contextDiffs: Record<string, string>;
    constraintSources: string[];
  }[];
  dependencies: {
    sourceId: string;
    targetId: string;
    contextualInfluence: string;
  }[];
};

export interface GraphNode {
  id: string;
  type: "message" | "tool_call";
  data: any;
}

export interface GraphEdge {
  source: string;
  target: string;
  metadata: {
    contextualInfluence: string;
  };
}

export class ContextualToolCallDependencyGraphVisualizer {
  private payload: ContextualDependencyPayload;

  constructor(payload: ContextualDependencyPayload) {
    this.payload = payload;
  }

  private extractToolCallNodes(toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    contextDiffs: Record<string, string>;
    constraintSources: string[];
  }[]): GraphNode[] {
    return toolCalls.map((tc, index) => ({
      id: `tool_call_${tc.id}`,
      type: "tool_call",
      data: {
        name: tc.name,
        input: tc.input,
        contextDiffs: tc.contextDiffs,
        constraintSources: tc.constraintSources,
      },
    }));
  }

  private extractMessageNodes(messages: Message[]): GraphNode[] {
    return messages.map((message, index) => {
      if (message.role === "user") {
        return {
          id: `message_user_${index}`,
          type: "message",
          data: { role: "user", content: message as UserMessage },
        };
      } else if (message.role === "assistant") {
        return {
          id: `message_assistant_${index}`,
          type: "message",
          data: { role: "assistant", content: message as AssistantMessage },
        };
      } else if (message.role === "tool") {
        return {
          id: `message_tool_${index}`,
          type: "message",
          data: { role: "tool", content: message as ToolResultMessage },
        };
      }
      throw new Error("Unknown message role");
    });
  }

  private extractEdges(dependencies: {
    sourceId: string;
    targetId: string;
    contextualInfluence: string;
  }[]): GraphEdge[] {
    return dependencies.map((dep, index) => ({
      source: dep.sourceId,
      target: dep.targetId,
      metadata: {
        contextualInfluence: dep.contextualInfluence,
      },
    }));
  }

  public visualize(): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    const toolCallNodes = this.extractToolCallNodes(this.payload.toolCalls);
    const messageNodes = this.extractMessageNodes(this.payload.messages);
    const edges = this.extractEdges(this.payload.dependencies);

    const allNodes: GraphNode[] = [...toolCallNodes, ...messageNodes];

    return {
      nodes: allNodes,
      edges: edges,
    };
  }
}