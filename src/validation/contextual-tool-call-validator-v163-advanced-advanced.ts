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

export type ToolCallSequence = Message[];

export interface ContextualRule {
  // Condition that must be met for the tool call to be valid
  condition: (context: {
  history: ToolCallSequence;
  currentContext: Record<string, unknown>;
  }) => boolean;
  // Optional message if the condition fails
  failureMessage?: string;
}

export interface AdvancedValidatorOptions {
  rules: ContextualRule[];
}

export class ContextualToolCallValidator {
  private readonly options: AdvancedValidatorOptions;

  constructor(options: AdvancedValidatorOptions) {
    this.options = options;
  }

  private validateSingleCall(
    call: ToolUseBlock,
    history: ToolCallSequence,
    context: Record<string, unknown>
  ): {
    isValid: boolean;
    message: string;
  } {
    for (const rule of this.options.rules) {
      if (!rule.condition({ history, currentContext: context })) {
        return {
          isValid: false,
          message: rule.failureMessage || "Tool call violates a defined contextual dependency rule.",
        };
      }
    }
    return { isValid: true, message: "Tool call is valid." };
  }

  public validateSequence(
    toolCalls: ToolUseBlock[],
    fullContext: Record<string, unknown>
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let history: ToolCallSequence = [];
    let currentContext: Record<string, unknown> = { ...fullContext };

    for (let i = 0; i < toolCalls.length; i++) {
      const call = toolCalls[i];

      // Simulate history accumulation for context checking
      // In a real scenario, history would be derived from the full Message sequence leading up to this point.
      // Here, we approximate by using the provided history and context.
      const validationResult = this.validateSingleCall(
        call,
        history,
        currentContext
      );

      if (!validationResult.isValid) {
        errors.push(`Step ${i + 1} (Tool: ${call.name}): ${validationResult.message}`);
      }

      // Update history and context for the next iteration (simplified)
      // For demonstration, we just append a placeholder message representing the call.
      history.push({
        role: "assistant",
        content: [{ type: "tool_use", id: call.id, name: call.name, input: call.input }],
      } as ContentBlock[]);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}