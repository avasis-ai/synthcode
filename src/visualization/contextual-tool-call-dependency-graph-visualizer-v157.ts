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

export interface DependencyConstraint {
  type: "temporal" | "resource" | "capability";
  sourceCallId: string;
  targetCallId: string;
  description: string;
  details: Record<string, unknown>;
}

export interface ToolCallDependency {
  callId: string;
  toolName: string;
  input: Record<string, unknown>;
  dependencies: DependencyConstraint[];
}

export interface ContextualDependencyGraphPayload {
  messages: Message[];
  toolCalls: ToolCallDependency[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  constructor(private payload: ContextualDependencyGraphPayload) {}

  public renderGraphStructure(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    const callIdToToolCall = new Map<string, ToolCallDependency>();
    this.payload.toolCalls.forEach(tc => {
      callIdToToolCall.set(tc.callId, tc);
      nodes.push({
        id: tc.callId,
        label: `${tc.toolName} (${tc.callId.substring(0, 4)}...)`,
        type: "tool_call",
        details: {
          dependencies: tc.dependencies,
        },
      });
    });

    this.payload.toolCalls.forEach(sourceCall => {
      sourceCall.dependencies.forEach(constraint => {
        const sourceNode = {
          id: sourceCall.callId,
          label: `${sourceCall.toolName} (Source)`,
          type: "tool_call",
        };
        const targetNode = {
          id: constraint.targetCallId,
          label: `Target Call (${constraint.targetCallId.substring(0, 4)}...)`,
          type: "tool_call",
        };

        edges.push({
          source: sourceNode.id,
          target: targetNode.id,
          label: `${constraint.type}: ${constraint.description}`,
          constraintDetails: constraint,
        });
      });
    });

    return { nodes, edges };
  }

  public getDependencyDetails(callId: string): DependencyConstraint[] {
    const toolCall = this.payload.toolCalls.find(tc => tc.callId === callId);
    return toolCall ? toolCall.dependencies : [];
  }
}