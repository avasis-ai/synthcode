import { Message, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidBasic {
  private messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  private extractToolCalls(message: Message): { id: string; name: string; input: Record<string, unknown> }[] {
    if (message.role === "assistant" && Array.isArray((message as any).content)) {
      const contentBlocks = (message as any).content;
      const toolUseBlocks: ToolUseBlock[] = contentBlocks.filter(
        (block: any) => block.type === "tool_use"
      );
      return toolUseBlocks.map((block: ToolUseBlock) => ({
        id: block.id,
        name: block.name,
        input: block.input,
      }));
    }
    return [];
  }

  private extractToolResults(message: Message): { tool_use_id: string; content: string }[] {
    if (message.role === "tool" && typeof message === 'object' && 'tool_use_id' in message) {
      return [{
        tool_use_id: message.tool_use_id,
        content: message.content,
      }];
    }
    return [];
  }

  private getNodesAndEdges(): { nodes: string[]; edges: string[] } {
    const nodes: Set<string> = new Set();
    const edges: Set<string> = new Set<string>();

    let currentNodeId: string | null = null;

    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      const messageId = `M${i}`;
      nodes.add(messageId);

      if (message.role === "user") {
        nodes.add("User");
        if (i > 0) {
          edges.add(`${currentNodeId || "Start"} --> ${messageId}`);
        }
        currentNodeId = messageId;
        continue;
      }

      if (message.role === "assistant") {
        const toolCalls = this.extractToolCalls(message);
        if (toolCalls.length > 0) {
          const toolCallNodes = toolCalls.map(tc => `T${tc.id}`);
          toolCallNodes.forEach(nodeId => nodes.add(nodeId));

          if (currentNodeId) {
            edges.add(`${currentNodeId} --> ${messageId}`);
          }
          toolCallNodes.forEach(toolCallNodeId => {
            edges.add(`${messageId} --> ${toolCallNodeId}`);
          });
          currentNodeId = toolCallNodes[toolCallNodes.length - 1] || messageId;
        } else {
          nodes.add(messageId);
          if (currentNodeId) {
            edges.add(`${currentNodeId} --> ${messageId}`);
          }
          currentNodeId = messageId;
        }
        continue;
      }

      if (message.role === "tool") {
        const toolResults = this.extractToolResults(message);
        if (toolResults.length > 0) {
          const toolResultNodes = toolResults.map(tr => `R${tr.tool_use_id}`);
          toolResultNodes.forEach(nodeId => nodes.add(nodeId));

          if (currentNodeId) {
            edges.add(`${currentNodeId} --> ${messageId}`);
          }
          toolResultNodes.forEach(toolResultNodeId => {
            edges.add(`${messageId} --> ${toolResultNodeId}`);
          });
          currentNodeId = toolResultNodes[toolResultNodes.length - 1] || messageId;
        }
      }
    }

    return {
      nodes: Array.from(nodes),
      edges: Array.from(edges),
    };
  }

  public generateMermaidGraph(): string {
    const { nodes, edges } = this.getNodesAndEdges();

    const nodeDefinitions = nodes.map(nodeId => {
      let label = nodeId;
      if (nodeId.startsWith("M")) {
        const index = parseInt(nodeId.substring(1));
        const message = this.messages[index];
        if (message?.role === "user") {
          label = "User Input";
        } else if (message?.role === "assistant") {
          label = "Assistant Response";
        } else if (message?.role === "tool") {
          label = "Tool Result";
        }
      } else if (nodeId.startsWith("T")) {
        const toolCall = this.messages.find((m: Message) => m.role === "assistant" && Array.isArray((m as any).content))?.content.filter((block: any) => block.type === "tool_use")[0];
        if (toolCall) {
          label = `Tool Call: ${toolCall.name}`;
        } else {
          label = "Tool Call";
        }
      } else if (nodeId.startsWith("R")) {
        label = "Tool Result";
      }
      return `${nodeId}["${label}"]`;
    });

    const edgeDefinitions = edges.map(edge => edge.replace("-->", " --> "));

    const graph = `graph TD\n${nodeDefinitions.join('\n')}\n\n${edgeDefinitions.join('\n')}`;
    return graph;
  }
}