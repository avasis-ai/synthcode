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

interface DependencyGraphConfig {
  startMessage: Message;
  endMessage: Message;
  toolCalls: {
    fromId: string;
    toId: string;
    type: "conditional" | "parallel" | "sequential";
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV139 {
  private config: DependencyGraphConfig;

  constructor(config: DependencyGraphConfig) {
    this.config = config;
  }

  private generateNodeId(message: Message, index: number): string {
    const role = message.role;
    const contentSnippet = typeof message.content === "string" ? message.content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "") : "content";
    return `${role}-${contentSnippet}-${index}`;
  }

  private generateMessageNode(message: Message, index: number): string {
    const nodeId = this.generateNodeId(message, index);
    let content = "";

    if (message.role === "user") {
      content = `User Input: "${message.content.substring(0, 50)}..."`;
    } else if (message.role === "assistant") {
      const blocks = (message as AssistantMessage).content;
      if (blocks.length > 0) {
        content = blocks.map(block => {
          if (block.type === "text") return `Text: "${block.text.substring(0, 30)}..."`;
          if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
          if (block.type === "thinking") return `Thinking: "${block.thinking.substring(0, 30)}..."`;
          return "";
        }).join("<br/>");
      } else {
        content = "No content provided.";
      }
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const errorStatus = toolResult.is_error ? "ERROR" : "SUCCESS";
      content = `Tool Result (${toolResult.tool_use_id}): ${errorStatus}. Content: "${toolResult.content.substring(0, 50)}..."`;
    }

    return `node_${nodeId}["${content}"]`;
  }

  private generateToolUseNode(toolUse: ToolUseBlock, index: number): string {
    const nodeId = `tool_${toolUse.id}`;
    return `node_${nodeId}["Tool: ${toolUse.name} (Input: ${JSON.stringify(toolUse.input)})"]`;
  }

  private generateGraphDefinition(): string {
    let nodes = "";
    let links = "";
    let nodeCounter = 0;

    // 1. Process Message Nodes (Simplified for demonstration, assuming a sequence)
    const allMessages: Message[] = [];
    // In a real scenario, we'd iterate over the full history. Here we use placeholders.
    allMessages.push({ role: "user", content: "Initial user query." } as UserMessage);
    allMessages.push({ role: "assistant", content: [{ type: "text", text: "Initial response text." }, { type: "tool_use", id: "t1", name: "search", input: { query: "data" } }] } as AssistantMessage);
    allMessages.push({ role: "tool", tool_use_id: "t1", content: "Search results received.", is_error: false } as ToolResultMessage);
    allMessages.push({ role: "assistant", content: [{ type: "text", text: "Final summary." }] } as AssistantMessage);

    const messageNodeIds: string[] = [];
    allMessages.forEach((msg, index) => {
      const nodeId = this.generateNodeId(msg, index);
      nodes += this.generateMessageNode(msg, index) + "\n";
      messageNodeIds.push(nodeId);
    });

    // 2. Process Tool Use Nodes (If any were explicitly passed or derived)
    // For simplicity, we'll just use the IDs from the message generation above.

    // 3. Process Dependencies (Advanced Syntax)
    this.config.toolCalls.forEach((call, index) => {
      const sourceNode = `node_${call.fromId}`;
      const targetNode = `node_${call.toId}`;
      let linkSyntax = "";

      switch (call.type) {
        case "conditional":
          linkSyntax = `-->|${call.condition || "Condition"}|`;
          break;
        case "parallel":
          linkSyntax = `-->{Parallel Branch}`;
          break;
        case "sequential":
          linkSyntax = "-->";
          break;
      }
      links += `${sourceNode}${linkSyntax}${targetNode}\n`;
    });

    return `graph TD\n${nodes}\n${links}`;
  }

  /**
   * Generates the Mermaid graph definition string using advanced syntax.
   * @returns {string} The Mermaid graph definition.
   */
  public renderGraph(): string {
    return this.generateGraphDefinition();
  }
}