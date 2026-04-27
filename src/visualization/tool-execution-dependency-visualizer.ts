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

export interface ToolCallDetail {
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
  output: string;
  isError: boolean;
}

export interface ExecutionStep {
  message: Message;
  toolCalls: ToolCallDetail[];
}

export interface VisualizationData {
  steps: ExecutionStep[];
}

export class ToolExecutionDependencyVisualizer {
  static visualize(history: Message[]): VisualizationData {
    const steps: ExecutionStep[] = [];
    let currentStep: ExecutionStep | null = null;

    for (const message of history) {
      if (message.role === "user") {
        currentStep = { message: message as UserMessage, toolCalls: [] };
        steps.push(currentStep);
        continue;
      }

      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        const toolCalls: ToolCallDetail[] = [];
        let hasToolUse = false;

        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            toolCalls.push({
              toolName: toolUseBlock.name,
              toolId: toolUseBlock.id,
              input: toolUseBlock.input,
              output: "", // Output is determined later
              isError: false,
            });
            hasToolUse = true;
          }
        }

        if (hasToolUse) {
          currentStep = { message: message as AssistantMessage, toolCalls: toolCalls };
          steps.push(currentStep);
        } else {
          // Handle text-only assistant messages if necessary, though the prompt focuses on tool flow
          currentStep = { message: message as AssistantMessage, toolCalls: [] };
          steps.push(currentStep);
        }
      } else if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const toolCallDetails: ToolCallDetail[] = [];

        // In a real scenario, we'd map tool_use_id to the corresponding tool call in the previous step.
        // For simplicity here, we assume the result relates to the last recorded tool call.
        const lastStep = steps[steps.length - 1];
        if (lastStep && lastStep.toolCalls.length > 0) {
          const lastToolCall = lastStep.toolCalls[lastStep.toolCalls.length - 1];
          const updatedToolCall: ToolCallDetail = {
            ...lastToolCall,
            output: toolResultMessage.content,
            isError: toolResultMessage.is_error ?? false,
          };
          toolCallDetails.push(updatedToolCall);
        }

        currentStep = { message: message as ToolResultMessage, toolCalls: toolCallDetails };
        steps.push(currentStep);
      }
    }

    return { steps };
  }
}