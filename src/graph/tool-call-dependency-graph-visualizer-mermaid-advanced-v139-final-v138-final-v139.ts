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

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV139 {
  private messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? JSON.stringify(message.content) : "empty";
    return `${rolePrefix}_${Math.floor(Math.random() * 100000)}_i${index}`;
  }

  private renderBlock(block: ContentBlock, nodeId: string): string {
    switch (block.type) {
      case "text":
        return `    --${nodeId}--[Text: ${block.text.substring(0, 30)}...]\n`;
      case "tool_use":
        return `    --${nodeId}--[Tool Call: ${block.name} (ID: ${block.id})]\n`;
      case "thinking":
        return `    --${nodeId}--[Thinking: ${block.thinking.substring(0, 30)}...]\n`;
      default:
        return "";
    }
  }

  private renderMessageNodes(message: Message, index: number): string {
    const nodeId = this.generateNodeId(message, index);
    let content = "";

    if (message.role === "user") {
      content = `User Input: "${message.content.text.substring(0, 30)}..."`;
    } else if (message.role === "assistant") {
      const blocks = (message as AssistantMessage).content;
      const blockRenderings = blocks.map((block, i) => this.renderBlock(block, `${nodeId}_b${i}`)).join("");
      content = `Assistant Response:\n${blockRenderings}`;
    } else if (message.role === "tool") {
      const toolMessage = message as ToolResultMessage;
      const errorStatus = toolMessage.is_error ? " (ERROR)" : "";
      content = `Tool Result (${toolMessage.tool_use_id}): ${toolMessage.content}${errorStatus}`;
    }

    return `    ${nodeId}["${content.replace(/[\r\n]/g, "\\n").trim()}"]\n`;
  }

  private renderDependencies(message: Message, index: number, nextMessage: Message | null, edgeLabel: string): string {
    if (!nextMessage) return "";

    const sourceId = this.generateNodeId(message, index);
    const targetId = this.generateNodeId(nextMessage, index + 1);

    let dependency = "";
    if (edgeLabel) {
      dependency = `    ${sourceId} -- "${edgeLabel}" --> ${targetId}\n`;
    } else {
      dependency = `    ${sourceId} --> ${targetId}\n`;
    }
    return dependency;
  }

  public generateMermaidGraph(): string {
    if (!this.messages || this.messages.length === 0) {
      return "graph TD\n    A[No messages to visualize]\n";
    }

    let mermaid = "graph TD\n";
    let nodeDeclarations = "";
    let edgeDeclarations = "";

    for (let i = 0; i < this.messages.length; i++) {
      const currentMessage = this.messages[i];
      const nextMessage = this.messages[i + 1] || null;

      // 1. Node Declarations
      nodeDeclarations += this.renderMessageNodes(currentMessage, i);

      // 2. Edge Declarations (Dependency Flow)
      let edge = "";
      if (nextMessage) {
        let label = "";
        if (currentMessage.role === "assistant" && nextMessage.role === "tool") {
          label = "Calls Tool";
        } else if (currentMessage.role === "tool" && nextMessage.role === "assistant") {
          label = "Processes Result";
        } else if (currentMessage.role === "user" && nextMessage.role === "assistant") {
          label = "Responds To";
        }
        edge = this.renderDependencies(currentMessage, i, nextMessage, label);
      }

      mermaid += nodeDeclarations + edge + "\n";
    }

    // Advanced Flow Control Simulation (Placeholder for complex logic)
    // This section simulates advanced branching/looping based on content inspection
    let advancedFlow = "";
    if (this.messages.length >= 3) {
      const firstToolUse = (this.messages[1] as AssistantMessage).content.find(
        (block) => block.type === "tool_use"
      );

      if (firstToolUse) {
        advancedFlow += `\n%% Advanced Flow Control Simulation (Conditional/Looping)\n`;
        advancedFlow += `    subgraph FlowControl\n`;
        advancedFlow += `        Start --> CheckCondition{Condition Met?}\n`;
        advancedFlow += `        CheckCondition -- Yes --> SuccessNode[Success Path]\n`;
        advancedFlow += `        CheckCondition -- No --> FailureNode[Failure Path]\n`;
        advancedFlow += `        SuccessNode --> End[End]\n`;
        advancedFlow += `        FailureNode --> End\n`;
        advancedFlow += `    end\n`;
      }
    }

    return mermaid + nodeDeclarations + edgeDeclarations + advancedFlow;
  }
}