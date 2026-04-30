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

export interface ExpectedNextStep {
  expected_tool_name: string;
  required_inputs: Record<string, { description: string; type: "string" | "number" }>;
  description: string;
}

export interface ValidationContext {
  messages: Message[];
  current_step_context: Record<string, unknown>;
  expected_next_step?: ExpectedNextStep;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: ValidationContext,
    nextStepInfo: ExpectedNextStep
  ): ValidationContext {
    if (!nextStepInfo) {
      return { ...context };
    }

    const enrichedContext: ValidationContext = {
      ...context,
      expected_next_step: nextStepInfo,
    };

    return enrichedContext;
  }
}