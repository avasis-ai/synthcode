import {
  Message,
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

export class StructuredThoughtStepValidatorV38 implements Validator {
  validate(context: ValidationContext): { isValid: boolean; errors: string[]; } {
    const steps = context.steps;
    const errors: string[] = [];
    const planIds: Set<string> = new Set<string>();

    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];

      if (currentStep.role === "assistant") {
        const assistantMessage = currentStep as AssistantMessage;
        const thinkingBlock = assistantMessage.content.find(
          (block) => (block as ThinkingBlock).type === "thinking"
        ) as ThinkingBlock | undefined;

        if (thinkingBlock) {
          const thinkingContent = thinkingBlock.thinking;

          // 1. Plan Identification and Tracking
          const planMatch = thinkingContent.match(/Plan ID: ([A-Z0-9]+)/);
          if (planMatch && planMatch[1]) {
            const planId = planMatch[1];
            planIds.add(planId);
          }

          // 2. Cross-Step Validation Logic
          if (i > 0) {
            const previousStep = steps[i - 1];

            // Rule: If current step is an Action, it must reference a Plan ID from a previous step.
            if (thinkingContent.includes("Action:") && !planIds.has("PLAN_ID_PLACEHOLDER")) {
              // Simplified check: Assume Action step implies a dependency on a plan.
              // In a real scenario, we'd parse the action content for a specific reference.
              if (!thinkingContent.includes("references Plan ID:")) {
                errors.push(
                  `Step ${i + 1} (Assistant) appears to be an Action step but does not explicitly reference a Plan ID from previous steps.`
                );
              }
            }
          }
        }
      }
    }

    // Final check: Ensure at least one plan was defined if actions were attempted.
    if (steps.some(s => (s as AssistantMessage).content.some(b => (b as ThinkingBlock).thinking.includes("Action:")))) {
      if (planIds.size === 0) {
        errors.push("Validation failed: No Plan IDs were defined in the sequence, but action steps were detected.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}