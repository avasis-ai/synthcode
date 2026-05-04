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

interface ValidationContext {
  steps: Message[];
}

interface Validator {
  validate(context: ValidationContext): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV15 implements Validator {
  validate(context: ValidationContext): { isValid: boolean; errors: string[]; } {
    const steps = context.steps;
    const errors: string[] = [];

    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];

      if (this.validateStepSequence(previousStep, currentStep, i, errors)) {
        // Validation logic already added errors to the array
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateStepSequence(
    previousStep: Message,
    currentStep: Message,
    index: number,
    errors: string[]
  ): boolean {
    let isValid = true;

    if (previousStep.role === "user" && currentStep.role === "assistant") {
      // Rule: An assistant response should follow a user message. (Generally true, but check content structure)
      if (this.isAssistantContentInvalid(currentStep.content)) {
        errors.push(
          `Step ${index}: Assistant response content is malformed or incomplete after user input.`
        );
        isValid = false;
      }
    } else if (previousStep.role === "assistant" && currentStep.role === "tool") {
      // Rule: A tool result must follow a tool call (which is usually embedded in the previous assistant message).
      if (!this.wasToolCallInPrevious(previousStep)) {
        errors.push(
          `Step ${index}: Tool result received, but the previous step did not contain a preceding tool call.`
        );
        isValid = false;
      }
    } else if (previousStep.role === "tool" && currentStep.role === "assistant") {
      // Rule: An assistant response after a tool result should incorporate the observation.
      if (!this.incorporatesObservation(previousStep, currentStep)) {
        errors.push(
          `Step ${index}: Assistant response after tool result should logically incorporate the observation from the tool result.`
        );
        isValid = false;
      }
    } else if (previousStep.role === "assistant" && currentStep.role === "user") {
      // Rule: User message should not immediately follow an assistant message unless it's a clear context reset.
      // This is often context-dependent, but we'll flag it as potentially redundant.
      // errors.push(`Warning: User message immediately follows assistant message at step ${index}.`);
    }

    return !isValid;
  }

  private wasToolCallInPrevious(message: Message): boolean {
    if (message.role !== "assistant") {
      return false;
    }
    // Simplified check: Look for ToolUseBlock in the content
    const contentBlocks = message.content;
    return contentBlocks.some(
      (block) => (block as ToolUseBlock).type === "tool_use"
    );
  }

  private incorporatesObservation(
    previousStep: Message,
    currentStep: Message
  ): boolean {
    if (previousStep.role !== "tool") return false;

    // Check if the assistant message content mentions the tool result contextually.
    // This is a heuristic check.
    const contentBlocks = currentStep.content;
    const hasText = contentBlocks.some((block): block is TextBlock => block.type === "text");

    // A basic check: if the tool result was an error, the assistant should acknowledge it.
    if (previousStep.content as ToolResultMessage | undefined?.is_error) {
      const errorText = (previousStep as ToolResultMessage | undefined)?.content || "";
      return hasText && (
        (contentBlocks.some((block): block is TextBlock => block.text.includes("error")))) ||
        (contentBlocks.some((block): block is TextBlock => block.text.includes(errorText.substring(0, 20))))
      );
    }

    return hasText;
  }

  private isAssistantContentInvalid(content: ContentBlock[]): boolean {
    if (!content || content.length === 0) {
      return true;
    }
    // Check if the content is just a single text block without any structure, which might indicate incompleteness.
    const textBlocks = content.filter((block): block is TextBlock => block.type === "text");
    return textBlocks.length === 0 && content.some(
      (block): block is ToolUseBlock => block.type === "tool_use"
    );
  }
}