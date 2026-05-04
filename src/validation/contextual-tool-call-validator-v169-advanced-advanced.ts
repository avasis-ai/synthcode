import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextPayload = {
  history: Message[];
  currentIntent: string;
  currentState: Record<string, any>;
  lastNSteps: Message[];
};

interface Validator {
  validate(context: ContextPayload, toolCall: ToolUseBlock): { isValid: boolean; reason?: string };
}

class ContextualToolCallValidator {
  private validators: Validator[] = [];

  constructor() {}

  addValidator(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  build(): ContextualToolCallValidator {
    return this;
  }

  validate(context: ContextPayload, toolCall: ToolUseBlock): { isValid: boolean; reason?: string } {
    for (const validator of this.validators) {
      const result = validator.validate(context, toolCall);
      if (!result.isValid) {
        return { isValid: false, reason: result.reason };
      }
    }
    return { isValid: true };
  }
}

class ContextualValidator implements Validator {
  validate(context: ContextPayload, toolCall: ToolUseBlock): { isValid: boolean; reason?: string } {
    if (!context.currentIntent) {
      return { isValid: false, reason: "ContextualValidator failed: Missing current user intent." };
    }
    if (!toolCall.name) {
      return { isValid: false, reason: "ContextualValidator failed: Tool call is missing a name." };
    }
    // Basic check: Ensure the tool name aligns vaguely with the intent
    if (!context.currentIntent.toLowerCase().includes(toolCall.name.toLowerCase()) && context.currentIntent.length > 10) {
      return { isValid: false, reason: `ContextualValidator failed: Tool '${toolCall.name}' seems unrelated to the current intent: "${context.currentIntent}"` };
    }
    return { isValid: true };
  }
}

class HistoryValidator implements Validator {
  validate(context: ContextPayload, toolCall: ToolUseBlock): { isValid: boolean; reason?: string } {
    if (context.lastNSteps.length < 2) {
      return { isValid: true };
    }

    const lastStep = context.lastNSteps[context.lastNSteps.length - 1];
    if (lastStep.role === "tool" && lastStep.content.includes("SUCCESS")) {
      // Heuristic: If the last tool call succeeded, check if the new call is redundant
      const lastToolCall = lastStep as ToolResultMessage;
      if (lastToolCall.tool_use_id === toolCall.id) {
        return { isValid: false, reason: "HistoryValidator failed: Attempting to call the same tool ID immediately after success." };
      }
    }
    return { isValid: true };
  }
}

class StateValidator implements Validator {
  validate(context: ContextPayload, toolCall: ToolUseBlock): { isValid: boolean; reason?: string } {
    const state = context.currentState;
    const requiredStateKey = toolCall.name.toLowerCase().replace(" ", "-");

    if (state && state[requiredStateKey] === undefined) {
      return { isValid: false, reason: `StateValidator failed: Required state '${requiredStateKey}' is missing in the current execution state.` };
    }
    return { isValid: true };
  }
}

export { ContextualToolCallValidator, ContextualValidator, HistoryValidator, StateValidator };