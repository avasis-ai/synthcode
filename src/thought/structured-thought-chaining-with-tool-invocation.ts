import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ToolInvocation = {
  tool_name: string;
  tool_input: Record<string, unknown>;
};

export interface ThoughtStep {
  thought: string;
  tool_invocation?: ToolInvocation;
}

export class StructuredThoughtChainer {
  private history: Message[] = [];

  constructor(initialHistory: Message[] = []) {
    this.history = initialHistory;
  }

  public getHistory(): Message[] {
    return [...this.history];
  }

  public addMessage(message: Message): void {
    this.history.push(message);
  }

  private extractLastThoughtStep(history: Message[]): ThoughtStep | null {
    if (history.length === 0) {
      return null;
    }

    const lastMessage = history[history.length - 1];

    if (lastMessage.role === "assistant") {
      // Simplified extraction: assume the last assistant message contains the structured thought
      // In a real system, we'd parse the content blocks more deeply.
      // For this structure, we'll assume the last thinking block represents the thought.
      const contentBlocks: ContentBlock[] = lastMessage.content;
      let thought = "";
      let toolInvocation: ToolInvocation | undefined = undefined;

      for (const block of contentBlocks) {
        if (block.type === "thinking") {
          thought += (block as ThinkingBlock).thinking + "\n";
        } else if (block.type === "tool_use") {
          toolInvocation = {
            tool_name: (block as ToolUseBlock).name,
            tool_input: (block as ToolUseBlock).input,
          };
        }
      }

      return {
        thought: thought.trim(),
        tool_invocation: toolInvocation,
      };
    }
    return null;
  }

  /**
   * Processes a new thought step, potentially involving a tool invocation.
   * @param thoughtStep The structured thought containing reflection and optional tool call.
   * @returns The updated history after processing the step.
   */
  public processThoughtStep(thoughtStep: ThoughtStep): Message[] {
    const newAssistantMessage: AssistantMessage = {
      role: "assistant",
      content: [],
    };

    // 1. Add Thinking Block
    newAssistantMessage.content.push({
      type: "thinking",
      thinking: thoughtStep.thought,
    } as ThinkingBlock);

    // 2. Add Tool Use Block if present
    if (thoughtStep.tool_invocation) {
      const toolUseBlock: ToolUseBlock = {
        type: "tool_use",
        id: "temp-id", // Placeholder, actual ID management needed in a real system
        name: thoughtStep.tool_invocation.tool_name,
        input: thoughtStep.tool_invocation.tool_input,
      };
      newAssistantMessage.content.push(toolUseBlock);
    }

    this.addMessage(newAssistantMessage);
    return [...this.history];
  }

  /**
   * Processes the result of a tool invocation, generating the next thought step.
   * This simulates the agent reading the tool output and deciding the next action.
   * @param toolResultMessage The result received from the tool execution.
   * @param nextThought The agent's reflection on the tool result.
   * @returns The updated history after incorporating the tool result and the next thought.
   */
  public processToolResult(toolResultMessage: Message, nextThought: ThoughtStep): Message[] {
    // 1. Record the tool result in history
    this.addMessage(toolResultMessage);

    // 2. Process the agent's reflection on the result
    const newAssistantMessage: AssistantMessage = {
      role: "assistant",
      content: [],
    };

    // Add Thinking Block (Reflection)
    newAssistantMessage.content.push({
      type: "thinking",
      thinking: nextThought.thought,
    } as ThinkingBlock);

    // If the next thought involves another tool call, add it
    if (nextThought.tool_invocation) {
      const toolUseBlock: ToolUseBlock = {
        type: "tool_use",
        id: "temp-id",
        name: nextThought.tool_invocation.tool_name,
        input: nextThought.tool_invocation.tool_input,
      };
      newAssistantMessage.content.push(toolUseBlock);
    }

    this.addMessage(newAssistantMessage);
    return [...this.history];
  }
}