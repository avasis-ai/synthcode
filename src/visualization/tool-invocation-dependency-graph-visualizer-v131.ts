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

export interface ToolInvocationDependency {
  sourceToolId: string;
  targetToolId: string;
  dependencyReason: string;
}

export interface ToolInvocationGraphPayload {
  messages: Message[];
  dependencies: ToolInvocationDependency[];
}

export class ToolInvocationDependencyGraphVisualizer {
  private payload: ToolInvocationGraphPayload;

  constructor(payload: ToolInvocationGraphPayload) {
    this.payload = payload;
  }

  public getNodes(): { id: string; label: string; type: "tool_call" | "tool_result"; metadata: Record<string, unknown> }[] {
    const nodes: { id: string; label: string; type: "tool_call" | "tool_result"; metadata: Record<string, unknown> }[] = [];
    const toolUseIds = new Set<string>();

    this.payload.messages.forEach(message => {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        assistantMessage.content.forEach(block => {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const nodeId = `tool_use_${toolUseBlock.id}`;
            nodes.push({
              id: nodeId,
              label: `${toolUseBlock.name} (Input: ${JSON.stringify(toolUseBlock.input)})`,
              type: "tool_call",
              metadata: {
                tool_id: toolUseBlock.id,
                name: toolUseBlock.name,
                input: toolUseBlock.input,
              },
            });
            toolUseIds.add(toolUseBlock.id);
          }
        });
      }
    });

    // Add nodes for tool results
    const toolResultMessages = this.payload.messages.filter(
      (msg): msg is ToolResultMessage => msg.role === "tool"
    );

    toolResultMessages.forEach((resultMsg, index) => {
      const nodeId = `tool_result_${resultMsg.tool_use_id}_${index}`;
      nodes.push({
        id: nodeId,
        label: `Tool Result (${resultMsg.tool_use_id})`,
        type: "tool_result",
        metadata: {
          tool_use_id: resultMsg.tool_use_id,
          content: resultMsg.content,
          is_error: resultMsg.is_error ?? false,
        },
      });
    });

    return nodes;
  }

  public getEdges(): { sourceId: string; targetId: string; label: string; reason: string }[] {
    const edges: { sourceId: string; targetId: string; label: string; reason: string }[] = [];

    this.payload.dependencies.forEach(dep => {
      // Assuming sourceToolId maps to a tool_use_id and targetToolId maps to a tool_use_id
      // We need to map tool_use_id to the actual node ID format used in getNodes()
      const sourceNodeId = `tool_use_${dep.sourceToolId}`;
      const targetNodeId = `tool_use_${dep.targetToolId}`;

      // For simplicity in this implementation, we link tool calls directly based on IDs provided in dependencies
      // A more robust system would map IDs to the specific node instance if multiple calls exist.
      edges.push({
        sourceId: sourceNodeId,
        targetId: targetNodeId,
        label: "->",
        reason: dep.dependencyReason,
      });
    });

    return edges;
  }
}