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

export type ToolCallThoughtStep = {
  thought: string;
  tool_call: {
    name: string;
    input: Record<string, unknown>;
  };
  expected_result_placeholder: string;
};

export class StructuredThoughtChainer {
  private steps: ToolCallThoughtStep[];
  private availableTools: Record<string, any>;

  constructor(steps: ToolCallThoughtStep[], availableTools: Record<string, any>) {
    this.steps = steps;
    this.availableTools = availableTools;
  }

  private validateStep(step: ToolCallThoughtStep): void {
    const { name } = step.tool_call;
    if (!this.availableTools[name]) {
      throw new Error(`Tool "${name}" is not available.`);
    }
  }

  private simulateToolExecution(toolName: string, input: Record<string, unknown>): string {
    const tool = this.availableTools[toolName];
    if (typeof tool.execute === 'function') {
      try {
        // Simulate execution with a deterministic result for typing purposes
        const result = tool.execute(input);
        return JSON.stringify(result);
      } catch (e) {
        return `Error executing ${toolName}: ${(e as Error).message}`;
      }
    }
    return `Simulation failed: Tool ${toolName} has no execute method.`;
  }

  public async process(): Promise<Message[]> {
    const processedMessages: Message[] = [];
    let currentThoughtStream: ContentBlock[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      // 1. Validate the step
      this.validateStep(step);

      // 2. Record the initial thought
      currentThoughtStream.push({ type: "thinking", thinking: step.thought });

      // 3. Simulate Tool Call
      const toolName = step.tool_call.name;
      const toolInput = step.tool_call.input;

      // Simulate the ToolUseBlock that would be generated
      const toolUseBlock: ToolUseBlock = {
        type: "tool_use",
        id: `call_${i}`,
        name: toolName,
        input: toolInput,
      };
      currentThoughtStream.push(toolUseBlock);

      // 4. Simulate Tool Result
      const simulatedResult = this.simulateToolExecution(toolName, toolInput);

      const toolResultMessage: ToolResultMessage = {
        role: "tool",
        tool_use_id: `call_${i}`,
        content: simulatedResult,
      };
      processedMessages.push(toolResultMessage);

      // 5. Stitch the result back into the thought stream for the next LLM turn
      // This simulates the LLM receiving the tool result and continuing its thought process.
      const resultTextBlock: TextBlock = {
        type: "text",
        text: `[Tool Result Received for ${toolName}]: ${simulatedResult}`,
      };
      currentThoughtStream.push(resultTextBlock);
    }

    // Final message structure: Combine initial thought + all tool results + final thought context
    const finalAssistantMessage: AssistantMessage = {
      role: "assistant",
      content: currentThoughtStream,
    };

    return [
      { role: "user", content: { type: "text", text: "Start processing structured steps." } } as UserMessage,
      finalAssistantMessage,
      ...processedMessages,
    ];
  }
}