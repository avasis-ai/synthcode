import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface Validator {
  validate(currentStep: Message, previousStep: Message | null): ValidationResult;
}

export class StructuredThoughtStepValidatorV39Advanced implements Validator {
  private readonly requiredToolMentions: Set<string>;

  constructor(requiredToolMentions: string[] = []) {
    this.requiredToolMentions = new Set(requiredToolMentions);
  }

  validate(currentStep: Message, previousStep: Message | null): ValidationResult {
    const errors: string[] = [];

    if (!previousStep) {
      return { isValid: true, errors: [] };
    }

    const currentContent = this.extractTextContent(currentStep);
    const previousContent = this.extractTextContent(previousStep);

    // 1. Tool Consistency Check
    if (this.requiredToolMentions.size > 0) {
      const mentionedTools = this.extractToolsMentioned(previousContent);
      for (const requiredTool of this.requiredToolMentions) {
        if (!mentionedTools.has(requiredTool)) {
          errors.push(`Structural Error: Previous step must have mentioned one of the required tools: ${Array.from(this.requiredToolMentions).join(', ')}.`);
        }
      }
    }

    // 2. Deviation Check (If previous step used a tool, current step must address it or explain deviation)
    const previousToolUsed = this.hasToolUseBlock(previousStep);
    const currentToolMentioned = this.extractToolsMentioned(currentContent);

    if (previousToolUsed && !currentToolMentioned.has("Tool X")) {
      // Simplified logic: If a tool was used, the current step must either mention the tool again or explicitly state the deviation.
      const deviationCheck = currentContent.toLowerCase().includes("deviation") || currentContent.toLowerCase().includes("change");
      if (!deviationCheck) {
        errors.push("Structural Warning: Previous step utilized a tool. Current step must explicitly address the tool's outcome or state a clear deviation.");
      }
    }

    // 3. Thinking Block Coherence Check
    if (currentStep.role === "assistant" && this.isThinkingBlockPresent(currentStep)) {
      const thinkingContent = this.getThinkingContent(currentStep);
      if (previousContent.includes("Initial analysis complete.") && !thinkingContent.toLowerCase().includes("next step")) {
        errors.push("Structural Warning: After completing initial analysis, the subsequent thinking block must outline the 'next step'.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private extractTextContent(message: Message): string {
    if (message.role === "user") {
      return message.content;
    }
    if (message.role === "assistant") {
      return message.content.map(block => {
        if (block.type === "text") return block.text;
        if (block.type === "thinking") return `[THINKING]: ${block.thinking}`;
        return "";
      }).join(" ");
    }
    if (message.role === "tool") {
      return `Tool Result: ${message.content}`;
    }
    return "";
  }

  private hasToolUseBlock(message: Message): boolean {
    if (message.role === "assistant") {
      return message.content.some(block => block.type === "tool_use");
    }
    return false;
  }

  private isThinkingBlockPresent(message: Message): boolean {
    if (message.role === "assistant") {
      return message.content.some(block => block.type === "thinking");
    }
    return false;
  }

  private getThinkingContent(message: Message): string {
    if (message.role === "assistant") {
      const thinkingBlock = message.content.find(block => block.type === "thinking") as ThinkingBlock | undefined;
      return thinkingBlock ? thinkingBlock.thinking : "";
    }
    return "";
  }

  private extractToolsMentioned(content: string): Set<string> {
    const tools = new Set<string>();
    // Simple regex simulation for tool mentions (e.g., "Tool X", "Tool Y")
    const toolRegex = /(Tool [A-Z0-9]+)/g;
    let match: RegExpExecArray | null;
    while ((match = toolRegex.exec(content)) !== null) {
      tools.add(match[0]);
    }
    return tools;
  }
}

export const createStructuredThoughtStepValidator = (requiredToolMentions: string[] = []): StructuredThoughtStepValidatorV39Advanced => {
  return new StructuredThoughtStepValidatorV39Advanced(requiredToolMentions);
};