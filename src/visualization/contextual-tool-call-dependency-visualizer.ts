import {
  Message,
  ContentBlock,
  ToolUseBlock,
  ToolResultMessage,
} from "./types";

export interface ToolCallDependencyPayload {
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    dependencies: string[];
  }[];
  executionTrace: Message[];
}

export interface DependencyEdge {
  sourceToolCallId: string;
  targetToolCallId: string;
  reason: string;
}

export interface DependencyGraphData {
  nodes: {
    id: string;
    name: string;
    type: "tool_call" | "message";
    details: any;
  }[];
  edges: DependencyEdge[];
}

export class ContextualToolCallDependencyVisualizer {
  private payload: ToolCallDependencyPayload;

  constructor(payload: ToolCallDependencyPayload) {
    this.payload = payload;
  }

  private extractToolCallNodes(): {
    id: string;
    name: string;
    details: any;
  }[] {
    return this.payload.toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.name,
      details: {
        input: tc.input,
        dependencies: tc.dependencies,
      },
    }));
  }

  private extractMessageNodes(): {
    id: string;
    name: string;
    details: any;
  }[] {
    const messageNodes: {
      id: string;
      name: string;
      details: any;
    }[] = [];
    this.payload.executionTrace.forEach((message, index) => {
      let name: string = "Message";
      let details: any = {
        role: message.role,
        content: message.content,
      };

      if (message.role === "tool") {
        name = `Tool Result (${message.tool_use_id})`;
        details = {
          role: "tool",
          tool_use_id: message.tool_use_id,
          content: message.content,
          is_error: message.is_error,
        };
      } else if (message.role === "user") {
        name = "User Input";
      } else if (message.role === "assistant") {
        name = "Assistant Response";
      }

      messageNodes.push({
        id: `msg_${index}`,
        name: name,
        details: details,
      });
    });
    return messageNodes;
  }

  private buildEdges(): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    for (let i = 0; i < this.payload.toolCalls.length; i++) {
      const currentToolCall = this.payload.toolCalls[i];
      for (const dependencyId of currentToolCall.dependencies) {
        // In a real scenario, we would map dependencyId back to a specific
        // preceding tool call or message ID. Here we simulate a generic edge.
        const sourceId = `tc_${i}`;
        const targetId = dependencyId; // Assuming dependencyId is the ID of the source
        edges.push({
          sourceToolCallId: targetId,
          targetToolCallId: currentToolCall.id,
          reason: `Depends on context from ${dependencyId}`,
        });
      }
    }
    return edges;
  }

  public visualize(): DependencyGraphData {
    const toolNodes = this.extractToolCallNodes();
    const messageNodes = this.extractMessageNodes();

    const nodes = [
      ...toolNodes.map(node => ({
        id: node.id,
        name: node.name,
        type: "tool_call",
        details: node.details,
      })),
      ...messageNodes.map(node => ({
        id: node.id,
        name: node.name,
        type: "message",
        details: node.details,
      })),
    ];

    const edges = this.buildEdges();

    return {
      nodes: nodes,
      edges: edges,
    };
  }
}