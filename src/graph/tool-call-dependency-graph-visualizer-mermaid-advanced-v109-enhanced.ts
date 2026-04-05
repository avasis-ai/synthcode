import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type EdgeType = "required" | "optional" | "fallback";

export interface ToolCallDependencyGraphConfig {
  messages: Message[];
  optionalEdgeEnabled: boolean;
  optionalEdgeStyle: string;
}

export class ToolCallDependencyGraphVisualizer {
  private readonly config: ToolCallDependencyGraphConfig;

  constructor(config: ToolCallDependencyGraphConfig) {
    this.config = config;
  }

  private buildNodes(messages: Message[]): Record<string, string> {
    const nodes: Record<string, string> = {};
    let nodeIdCounter = 1;

    for (const message of messages) {
      if (message.role === "user") {
        nodes[`user_${nodeIdCounter++}`] = `User Input: ${message.content.substring(0, 30)}...`;
      } else if (message.role === "assistant") {
        const content = message.content.filter(block => block.type !== "thinking").map(block => {
          if (block.type === "text") return `Text: ${block.text.substring(0, 30)}...`;
          if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
          return "";
        }).join(" | ");
        nodes[`assistant_${nodeIdCounter++}`] = `Assistant Response: ${content || "..."}`;
      } else if (message.role === "tool") {
        nodes[`tool_${message.tool_use_id}`] = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
      }
    }
    return nodes;
  }

  private buildEdges(messages: Message[]): string[] {
    const edges: string[] = [];
    let lastNodeId: string | null = null;

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];

      let sourceNodeId: string;
      let targetNodeId: string;
      let edgeType: EdgeType = "required";
      let label: string = "";

      if (previousMessage.role === "user") {
        sourceNodeId = `user_${(i - 1) + 1}`;
      } else if (previousMessage.role === "assistant") {
        sourceNodeId = `assistant_${(i - 1) + 1}`;
      } else if (previousMessage.role === "tool") {
        sourceNodeId = `tool_${previousMessage.tool_use_id}`;
      } else {
        continue;
      }

      if (currentMessage.role === "user") {
        targetNodeId = `user_${i + 1}`;
      } else if (currentMessage.role === "assistant") {
        targetNodeId = `assistant_${i + 1}`;
      } else if (currentMessage.role === "tool") {
        targetNodeId = `tool_${currentMessage.tool_use_id}`;
      } else {
        continue;
      }

      // Simplified logic for edge type determination based on sequence
      if (currentMessage.role === "tool" && previousMessage.role === "assistant") {
        edgeType = "fallback";
        label = "Tool Result";
      } else if (currentMessage.role === "assistant" && previousMessage.role === "user") {
        edgeType = "required";
        label = "Response";
      } else if (currentMessage.role === "assistant" && previousMessage.role === "tool") {
        edgeType = "optional";
        label = "Follow-up";
      } else {
        edgeType = "required";
        label = "Sequence";
      }

      const style = this.config.optionalEdgeEnabled && edgeType === "optional"
        ? `style: ${this.config.optionalEdgeStyle}`
        : "";

      edges.push(`${sourceNodeId} -->|${label}| ${targetNodeId}${style}`);
    }
    return edges;
  }

  public renderMermaidGraph(): string {
    const nodes = this.buildNodes(this.config.messages);
    const edges = this.buildEdges(this.config.messages);

    let mermaid = "graph TD;\n";
    mermaid += "%% Nodes\n";
    for (const nodeId in nodes) {
      mermaid += `${nodeId}["${nodes[nodeId]}"]\n`;
    }

    mermaid += "\n%% Edges\n";
    mermaid += edges.join("\n");

    return mermaid;
  }
}