import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface ValidationContext {
  steps: Message[];
  currentIndex: number;
}

export class StructuredThoughtStepValidatorV28AdvancedAdvanced {
  validate(context: ValidationContext): { isValid: boolean; errors: string[] } {
    const { steps, currentIndex } = context;
    const currentStep = steps[currentIndex];
    const errors: string[] = [];

    if (!currentStep) {
      return { isValid: false, errors: ["Cannot validate: No step found at the current index."] };
    }

    // 1. Basic Content Validation (Placeholder for specific step type checks)
    if (typeof currentStep.role !== 'string') {
      errors.push("Step role is invalid.");
    }

    // 2. Cross-Step Dependency Check (Step N requires output from Step N-2)
    if (currentIndex >= 2) {
      const requiredPreviousStep = steps[currentIndex - 2];
      if (requiredPreviousStep && requiredPreviousStep.role === 'tool' && !this.checkDependency(currentStep, requiredPreviousStep)) {
        errors.push(`Cross-step dependency failed: Step ${currentIndex} requires valid output from Step ${currentIndex - 2} (Tool Result).`);
      }
    }

    // 3. Temporal Consistency Check (Example: Thinking block must follow a user input or tool result)
    if (currentStep.role === 'assistant' && Array.isArray((currentStep as any).content)) {
      const contentBlocks = (currentStep as any).content;
      if (contentBlocks.some(block => block.type === 'thinking' && !this.isPrecededByRelevantInput(steps, currentIndex))) {
        errors.push("Temporal inconsistency: Thinking block found without preceding user input or tool result.");
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }

  private checkDependency(currentStep: Message, requiredStep: Message): boolean {
    if (requiredStep.role !== 'tool' || typeof requiredStep.content !== 'string') {
      return false;
    }

    if (currentStep.role === 'assistant') {
      const contentBlocks = (currentStep as any).content;
      if (contentBlocks.some(block => block.type === 'tool_use')) {
        const toolUseBlock = block as ToolUseBlock;
        // Simplified check: Does the current tool use ID match the required step's context?
        return toolUseBlock.id === requiredStep.tool_use_id;
      }
    }
    return false;
  }

  private isPrecededByRelevantInput(steps: Message[], currentIndex: number): boolean {
    if (currentIndex === 0) return false;
    const previousStep = steps[currentIndex - 1];
    return previousStep.role === 'user' || previousStep.role === 'tool';
  }
}

export { StructuredThoughtStepValidatorV28AdvancedAdvanced };