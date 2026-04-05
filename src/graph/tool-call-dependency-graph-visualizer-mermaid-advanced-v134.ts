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

export interface AdvancedGraphOptions {
  loopStart?: string;
  loopEnd?: string;
  conditionalBranch?: {
    condition: string;
    truePath: string;
    falsePath: string;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private messages: Message[];
  private options: AdvancedGraphOptions;

  constructor(messages: Message[], options: AdvancedGraphOptions = {}) {
    this.messages = messages;
    this.options = options;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    return `${rolePrefix}-${index}`;
  }

  private renderBlock(block: ContentBlock, nodeId: string): string {
    switch (block.type) {
      case "text":
        return `(${nodeId}) --> |Text| (${nodeId}-text)`;
      case "tool_use":
        return `(${nodeId}) --> |Tool Use: ${block.name}| (${nodeId}-tool)`;
      case "thinking":
        return `(${nodeId}) --> |Thinking| (${nodeId}-think)`;
    }
    return "";
  }

  private renderMessageEdges(message: Message, index: number): string {
    const nodeId = this.generateNodeId(message, index);
    let edges = "";

    if (message.role === "assistant" && "content" in message && Array.isArray(message.content)) {
      const contentBlocks = message.content as ContentBlock[];
      contentBlocks.forEach((block, blockIndex) => {
        const blockNodeId = `${nodeId}-block${blockIndex}`;
        if (block.type === "text") {
          edges += `(${nodeId}) --> |Text| (${blockNodeId}); `;
        } else if (block.type === "tool_use") {
          edges += `(${nodeId}) --> |Tool Use: ${block.name}| (${blockNodeId}); `;
        } else if (block.type === "thinking") {
          edges += `(${nodeId}) --> |Thinking| (${blockNodeId}); `;
        }
      });
    } else if (message.role === "tool") {
      edges += `(${nodeId}) --> |Tool Result| (${nodeId}-result)`;
    }
    return edges.trim();
  }

  private renderGraphStructure(): string {
    let mermaid = "graph TD\n";
    let edges = "";
    let currentStepId = "Start";

    // 1. Initial Setup
    mermaid += `    ${currentStepId} --> A1[User Input];\n`;

    // 2. Process Messages
    this.messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      let messageEdges = "";

      if (message.role === "user") {
        messageEdges = `(${nodeId})[User Message] --> |Content| (${nodeId}-content)`;
        edges += messageEdges;
        currentStepId = nodeId;
      } else if (message.role === "assistant") {
        messageEdges = this.renderMessageEdges(message, index);
        edges += messageEdges;
        currentStepId = nodeId;
      } else if (message.role === "tool") {
        messageEdges = this.renderMessageEdges(message, index);
        edges += messageEdges;
        currentStepId = nodeId;
      }
    });

    // 3. Advanced Flow Control (Looping/Conditionals)
    if (this.options.loopStart && this.options.loopEnd) {
      mermaid += `\n%% Loop Definition\n`;
      mermaid += `loop_start{${this.options.loopStart}} --> ${this.options.loopEnd}:::loop_end;`;
    }

    if (this.options.conditionalBranch && this.options.conditionalBranch.length > 0) {
      mermaid += `\n%% Conditional Branching\n`;
      this.options.conditionalBranch.forEach((branch, index) => {
        mermaid += `branch${index} -- Condition: ${branch.condition} --> ${branch.truePath}:::true;`;
        mermaid += `branch${index} -- Else --> ${branch.falsePath}:::false;\n`;
      });
    }

    // 4. Combine Edges
    mermaid += "\n%% Message Flow Edges\n";
    mermaid += edges;

    return mermaid;
  }

  public generateMermaidGraph(): string {
    return this.renderGraphStructure();
  }
}