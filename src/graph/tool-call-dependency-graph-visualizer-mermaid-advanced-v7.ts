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
  messages: Message[];
  graphType: "mermaid-advanced-v7";
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV7 {
  private readonly config: DependencyGraphConfig;

  constructor(config: DependencyGraphConfig) {
    this.config = config;
  }

  private parseToolCalls(messages: Message[]): {
    toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[];
    dependencies: Map<string, string[]>;
  } {
    const toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[] = [];
    const dependencies = new Map<string, string[]>();

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use" && block as ToolUseBlock) {
            const toolUse = block as ToolUseBlock;
            toolCalls.push({
              id: toolUse.id,
              name: toolUse.name,
              input: toolUse.input,
            });
            // Simple dependency: ToolUse -> Next Step (or end)
            // For advanced visualization, we'll map tool use to a conceptual node.
            const sourceNode = `ToolCall_${toolUse.id}`;
            if (!dependencies.has(sourceNode)) {
              dependencies.set(sourceNode, []);
            }
          }
        }
      }
    }
    return { toolCalls, dependencies };
  }

  private generateMermaidGraph(
    toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[];
    dependencies: Map<string, string[]>
  ): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes (User Input, Assistant Thinking, Tool Calls)
    mermaid += "subgraph User Input\n";
    mermaid += "    U[User Message]\n";
    mermaid += "end\n";

    let lastToolCallId: string | null = null;

    for (let i = 0; i < this.config.messages.length; i++) {
      const message = this.config.messages[i];

      if (message.role === "user") {
        // User message node already defined above, but we ensure it's present.
        continue;
      }

      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        let currentToolCallId: string | null = null;

        for (const block of assistantMessage.content) {
          if (block.type === "tool_use" && block as ToolUseBlock) {
            const toolUse = block as ToolUseBlock;
            const toolCallId = `ToolCall_${toolUse.id}`;
            mermaid += `\n${toolCallId}["Tool: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input)}"]\n`;
            currentToolCallId = toolCallId;
          } else if (block.type === "thinking" && block as ThinkingBlock) {
            const thinkingId = `Thinking_${i}_${block.thinking.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
            mermaid += `\n${thinkingId}["Thinking: ${block.thinking.substring(0, 30)}..."]\n`;
          }
        }
        lastToolCallId = currentToolCallId;
      }
    }

    // 2. Define Subgraph for Tool Dependencies (Advanced Feature)
    mermaid += "\nsubgraph Tool Dependencies\n";
    // This subgraph groups all tool calls and their conceptual flow.
    // We use styling to highlight the complexity.
    mermaid += "    direction LR\n";
    mermaid += "    style Tool Dependencies fill:#f9f,stroke:#333,stroke-width:2px\n";

    // Link nodes sequentially if multiple tool calls occur in one turn (simplified)
    const toolCallNodes = toolCalls.map(tc => `ToolCall_${tc.id}`);
    if (toolCallNodes.length > 0) {
        mermaid += `    ${toolCallNodes.join(" --> ")}\n`;
    }

    mermaid += "end\n";

    // 3. Define Edges (Flow)
    mermaid += "\n%% Edges\n";
    let lastNodeId: string | null = "U";

    for (let i = 1; i < this.config.messages.length; i++) {
      const message = this.config.messages[i];
      let currentNodeId: string | null = null;

      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        let foundNode = false;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use" && block as ToolUseBlock) {
            const toolUse = block as ToolUseBlock;
            currentNodeId = `ToolCall_${toolUse.id}`;
            foundNode = true;
            break;
          } else if (block.type === "thinking" && block as ThinkingBlock) {
            const thinkingId = `Thinking_${i}_${block.thinking.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`;
            currentNodeId = thinkingId;
            foundNode = true;
            break;
          }
        }
        if (foundNode) {
            // Link previous step to the current step
            if (lastNodeId) {
                mermaid += `${lastNodeId} --> ${currentNodeId};\n`;
            }
            lastNodeId = currentNodeId;
        }
      } else if (message.role === "tool") {
        // Tool result links back to the previous tool call context (simplified)
        if (lastToolCallId) {
             mermaid += `${lastToolCallId} -->|Result| ToolResult_${i};\n`;
             lastNodeId = `ToolResult_${i}`;
        }
      }
    }

    // Final connection from User to the first Assistant step
    if (lastNodeId && this.config.messages.length > 1 && this.config.messages[1].role === "assistant") {
        mermaid += `U --> ${lastNodeId};\n`;
    }


    return mermaid;
  }

  visualize(): string {
    const { toolCalls, dependencies } = this.parseToolCalls(this.config.messages);
    return this.generateMermaidGraph(toolCalls, dependencies);
  }
}