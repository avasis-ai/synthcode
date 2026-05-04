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

export type ToolInvocationThoughtStep = {
  thought: string;
  tool_calls: ToolUseBlock[];
  tool_results: Record<string, {
    result: string;
    is_error: boolean;
  }>;
  final_thought: string;
};

export class StructuredThoughtChainer {
  private history: Message[] = [];

  constructor(initialHistory: Message[] = []) {
    this.history = initialHistory;
  }

  private addMessage(message: Message): void {
    this.history.push(message);
  }

  private processToolInvocationStep(step: ToolInvocationThoughtStep): void {
    const toolUseMessages: Message[] = step.tool_calls.map((toolUse) => {
      return {
        role: "assistant",
        content: [
          { type: "tool_use", id: toolUse.id, name: toolUse.name, input: toolUse.input },
        ],
      } as AssistantMessage;
    });

    const toolResultMessages: Message[] = Object.keys(step.tool_results).map((toolId) => {
      const result = step.tool_results[toolId];
      return {
        role: "tool",
        tool_use_id: toolId,
        content: result.result,
        is_error: result.is_error,
      } as ToolResultMessage;
    });

    this.addMessage(step as any); // Simplified for demonstration, actual structure might need adjustment
    toolUseMessages.forEach(msg => this.addMessage(msg));
    toolResultMessages.forEach(msg => this.addMessage(msg));
  }

  public chainWithToolInvocation(
    initialThought: string,
    toolInvocationSteps: ToolInvocationThoughtStep[]
  ): Message[] {
    let currentChain: Message[] = [...this.history];

    // 1. Initial thought (if not already in history)
    const initialThoughtMessage: Message = {
      role: "assistant",
      content: [{ type: "thinking", thinking: initialThought }],
    } as AssistantMessage;
    this.addMessage(initialThoughtMessage);

    // 2. Process structured tool invocation steps
    toolInvocationSteps.forEach((step, index) => {
      this.processToolInvocationStep(step);
      // In a real scenario, we might add a final thought after processing results
    });

    return [...this.history];
  }

  public serializeChain(chain: Message[]): string {
    let output = "--- Structured Thought Chain ---\n";
    let currentStep = 0;

    for (const message of chain) {
      output += `\n[Step ${++currentStep}] Role: ${message.role.toUpperCase()}\n`;

      if (message.role === "user") {
        output += `Content: ${message.content.map(c => c.text || "").join(" ")}\n`;
      } else if (message.role === "assistant") {
        let contentStr = "";
        message.content.forEach(block => {
          if (block.type === "thinking") {
            contentStr += `\n[THINKING]: ${block.thinking}\n`;
          } else if (block.type === "tool_use") {
            contentStr += `\n[TOOL_USE]: ${block.name}(${JSON.stringify(block.input)}) [ID: ${block.id}]\n`;
          }
        });
        output += `Content: ${contentStr.trim()}\n`;
      } else if (message.role === "tool") {
        output += `Tool ID: ${message.tool_use_id}\n`;
        output += `Result Content: ${message.content}\n`;
        if (message.is_error) {
          output += "Status: ERROR\n";
        } else {
          output += "Status: SUCCESS\n";
        }
      }
    }
    output += "\n--- End of Chain ---";
    return output;
  }
}