import { Message, ToolUseBlock, ContentBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidationContext {
  messages: Message[];
  toolCalls: ToolUseBlock[];
}

interface Validator {
  validate(context: ValidationContext): ValidationResult;
}

class DependencyValidator implements Validator {
  validate(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    // Simplified dependency check: Ensure tool calls reference existing context elements if necessary.
    // In a real scenario, this would check if tool inputs match expected schemas or if tool calls are ordered correctly relative to user intent.
    if (context.toolCalls.length > 0) {
      // Placeholder logic: Assume all tool calls must be present if the last message was an assistant response suggesting tools.
      const lastMessage = context.messages[context.messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant" && !lastMessage.content.some(block => block.type === "tool_use")) {
        // This check is highly context-dependent, keeping it simple for structure.
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class CapabilityValidator implements Validator {
  validate(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    // Simplified capability check: Ensure tool names are known or that the structure is sound.
    const knownTools: Set<string> = new Set(["get_weather", "send_email"]);
    for (const toolUse of context.toolCalls) {
      if (!knownTools.has(toolUse.name)) {
        errors.push(`Tool '${toolUse.name}' used in tool call is not recognized or available.`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class TemporalOrderValidator implements Validator {
  validate(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    // Check for logical ordering: User -> Assistant (Tool Call) -> Tool Result
    let expectingToolResult = false;

    for (let i = 0; i < context.messages.length; i++) {
      const message = context.messages[i];
      if (message.role === "assistant" && message.content.some(block => block.type === "tool_use")) {
        // If we see a tool use, the next expected message (if any) should be a tool result.
        expectingToolResult = true;
      } else if (message.role === "tool") {
        if (!expectingToolResult) {
          errors.push(`Tool result received for tool_use_id ${message.tool_use_id} without a preceding tool use call.`);
        }
        expectingToolResult = false;
      } else if (expectingToolResult && message.role !== "tool") {
        // If we expected a tool result but got something else, it's an ordering error.
        errors.push(`Expected a tool result after the last tool use, but received message of role '${message.role}'.`);
        expectingToolResult = false;
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

export class StructuredToolCallValidator {
  private validators: Validator[] = [
    new DependencyValidator(),
    new CapabilityValidator(),
    new TemporalOrderValidator(),
  ];

  validate(context: ValidationContext): ValidationResult {
    const allErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (!result.isValid) {
        overallValid = false;
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}