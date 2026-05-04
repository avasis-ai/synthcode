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

export interface ContextualDependency {
  sourceId: string;
  targetId: string;
  dependencyType: "state_read" | "state_write" | "resource_constraint" | "sequential";
  contextId: string;
  details: Record<string, any>;
}

export interface AdvancedVisualizationPayload {
  messages: Message[];
  dependencies: ContextualDependency[];
  initialContext: Record<string, any>;
}

export class ContextualToolCallDependencyVisualizer {
  private payload: AdvancedVisualizationPayload;

  constructor(payload: AdvancedVisualizationPayload) {
    this.payload = payload;
  }

  private extractToolCalls(messages: Message[]): { id: string; name: string; input: Record<string, unknown> }[] {
    const toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            toolCalls.push({
              id: toolUseBlock.id,
              name: toolUseBlock.name,
              input: toolUseBlock.input,
            });
          }
        }
      }
    }
    return toolCalls;
  }

  private buildGraphStructure(toolCalls: { id: string; name: string; input: Record<string, unknown> }[]): { nodes: any[]; edges: any[] } {
    const nodes: any[] = toolCalls.map((call, index) => ({
      id: `tool_${call.id}`,
      label: `${call.name} (ID: ${call.id})`,
      type: "ToolCall",
      data: {
        name: call.name,
        input: call.input,
      },
      position: { x: index * 200, y: 0 },
    }));

    const edges: any[] = this.payload.dependencies.map(dep => ({
      source: `tool_${dep.sourceId}`,
      target: `tool_${dep.targetId}`,
      type: dep.dependencyType,
      label: `${dep.dependencyType}: ${JSON.stringify(dep.details)}`,
      context: dep.contextId,
    }));

    return { nodes, edges };
  }

  public visualize(): { nodes: any[]; edges: any[]; context: string } {
    const toolCalls = this.extractToolCalls(this.payload.messages);
    const { nodes, edges } = this.buildGraphStructure(toolCalls);

    return {
      nodes: nodes,
      edges: edges,
      context: "Contextual Dependency Graph",
    };
  }
}