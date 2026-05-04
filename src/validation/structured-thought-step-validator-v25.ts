import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ThoughtStep {
  id: string;
  stepIndex: number;
  content: ContentBlock[];
  referencesStepId?: string;
  reasoning?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class StructuredThoughtStepValidatorV25 {
  validate(steps: ThoughtStep[]): ValidationResult {
    const errors: string[] = [];

    if (!steps || steps.length === 0) {
      return { isValid: false, errors: ["Thought steps array cannot be empty."] };
    }

    const stepIds = steps.map(step => step.id);

    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];

      // 1. Basic structural validation
      if (!currentStep.id) {
        errors.push(`Step at index ${i} is missing an ID.`);
        continue;
      }

      // 2. Cross-step dependency check (referencesStepId)
      if (currentStep.referencesStepId) {
        if (!stepIds.includes(currentStep.referencesStepId)) {
          errors.push(
            `Step ${i} (ID: ${currentStep.id}) references an unknown step ID: ${currentStep.referencesStepId}.`
          );
        }
      }

      // 3. Cross-step dependency check (reasoning referencing previous steps)
      if (currentStep.reasoning) {
        const precedingSteps = steps.slice(0, i);
        const precedingIds = precedingSteps.map(s => s.id);

        // Simple check: Ensure reasoning mentions at least one preceding step ID if it's complex
        // For this implementation, we just check if the reasoning mentions any known ID.
        const mentionedIds = precedingIds.filter(id => currentStep.reasoning!.includes(id));
        if (mentionedIds.length === 0 && precedingSteps.length > 0) {
          errors.push(
            `Step ${i} (ID: ${currentStep.id}) has reasoning but does not explicitly reference any preceding step IDs.`
          );
        }
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}