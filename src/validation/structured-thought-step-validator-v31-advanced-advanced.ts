import { Message, ContentBlock, ThinkingBlock } from "./types";

export interface AdvancedThoughtStepValidatorRules {
  validateStep(step: Message, index: number, allSteps: Message[]): { isValid: boolean; error?: string };
  validateSequence(allSteps: Message[]): { isValid: boolean; error?: string };
}

export class StructuredThoughtStepValidatorAdvancedAdvanced implements AdvancedThoughtStepValidatorRules {
  private readonly requiredThinkingBlockPrefix: string;

  constructor(requiredThinkingBlockPrefix: string = "Thought Process:") {
    this.requiredThinkingBlockPrefix = requiredThinkingBlockPrefix;
  }

  validateStep(step: Message, index: number, allSteps: Message[]): { isValid: boolean; error?: string } {
    if (step.role !== "assistant") {
      return { isValid: true };
    }

    const thinkingBlock = this.findThinkingBlock(step);
    if (!thinkingBlock) {
      return { isValid: false, error: `Step at index ${index} (Assistant) must contain a thinking block.` };
    }

    const thinkingContent = thinkingBlock.thinking;

    if (!thinkingContent.startsWith(this.requiredThinkingBlockPrefix)) {
      return { isValid: false, error: `Thinking block at index ${index} must start with "${this.requiredThinkingBlockPrefix}"` };
    }

    // Basic check for logical flow continuity (e.g., if it's not the first step, it should reference previous context)
    if (index > 0) {
      const previousStep = allSteps[index - 1];
      if (previousStep.role === "user" && !thinkingContent.includes("User input")) {
        return { isValid: false, error: `Thinking block at index ${index} should acknowledge the preceding user input.` };
      }
    }

    return { isValid: true };
  }

  validateSequence(allSteps: Message[]): { isValid: boolean; error?: string } {
    if (allSteps.length < 2) {
      return { isValid: true };
    }

    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      const result = this.validateStep(step, i, allSteps);
      if (!result.isValid) {
        return { isValid: false, error: `Sequence validation failed at step ${i}: ${result.error}` };
      }
    }

    // Cross-step dependency check: Ensure the final step summarizes or concludes the chain.
    const lastStep = allSteps[allSteps.length - 1];
    if (lastStep.role === "assistant") {
      const thinkingBlock = this.findThinkingBlock(lastStep);
      if (thinkingBlock && !thinkingBlock.thinking.toLowerCase().includes("final answer") && !thinkingBlock.thinking.toLowerCase().includes("conclusion")) {
        return { isValid: false, error: "The final assistant step must contain a conclusion or final answer statement." };
      }
    }

    return { isValid: true };
  }

  private findThinkingBlock(message: Message): ThinkingBlock | undefined {
    if (message.role !== "assistant") return undefined;

    const contentBlocks: ContentBlock[] = (message as any).content || [];
    for (const block of contentBlocks) {
      if (block.type === "thinking" && typeof block === 'object' && 'thinking' in block) {
        return block as ThinkingBlock;
      }
    }
    return undefined;
  }
}