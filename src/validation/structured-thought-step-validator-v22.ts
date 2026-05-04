import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export class StructuredThoughtStepValidatorV22 {
  private readonly previousMessage: Message;

  constructor(previousMessage: Message) {
    this.previousMessage = previousMessage;
  }

  private getPreviousThinkingContent(): string | null {
    if (this.previousMessage.role === "assistant") {
      const blocks = (this.previousMessage as any).content;
      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          if (typeof block === "object" && "type" in block && block.type === "thinking") {
            return (block as ThinkingBlock).thinking;
          }
        }
      }
    }
    return null;
  }

  public validate(nextStepContent: ContentBlock[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const previousThinking = this.getPreviousThinkingContent();

    if (!previousThinking) {
      return { isValid: true, errors: [] };
    }

    const requiredStructure = "The next step must address the core assumption derived from the previous thought process.";

    if (nextStepContent.length === 0) {
      errors.push("The next step content cannot be empty.");
    } else {
      let hasTextBlock = false;
      let hasThinkingBlock = false;

      for (const block of nextStepContent) {
        if (block.type === "text") {
          hasTextBlock = true;
        } else if (block.type === "thinking") {
          hasThinkingBlock = true;
        }
      }

      if (!hasTextBlock) {
        errors.push("The next step must contain at least one text block.");
      }

      if (previousThinking && !nextStepContent.some(
        (block) =>
          typeof block === "object" &&
          "type" in block &&
          block.type === "thinking" &&
          (block as ThinkingBlock).thinking.includes("Based on previous thought:")
      )) {
        errors.push(
          `The next thought step should explicitly reference the previous reasoning. ${requiredStructure}`
        );
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}