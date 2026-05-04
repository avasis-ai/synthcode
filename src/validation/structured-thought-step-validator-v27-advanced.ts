import { Message, ContentBlock, ThinkingBlock } from "./types";

export interface AdvancedValidationContext {
  allSteps: Message[];
  currentStepIndex: number;
  currentStep: Message;
  precedingSteps: Message[];
  succeedingSteps: Message[];
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class StructuredThoughtStepValidatorAdvanced {
  validate(context: AdvancedValidationContext): ValidationResult {
    const errors: string[] = [];
    const { allSteps, currentStep, currentStepIndex, precedingSteps, succeedingSteps } = context;

    if (!currentStep) {
      return { isValid: false, errors: ["Current step is undefined in the validation context."] };
    }

    // 1. Basic structural checks (reusing concepts from simpler validators)
    if (typeof currentStep.content !== 'object' || !('thinking' in currentStep.content)) {
      // Assuming the primary content block for thought steps is ThinkingBlock
      // This check might need refinement based on exact Message structure, but we focus on cross-step logic.
    }

    // 2. Cross-step dependency checking (The core advanced feature)
    const thoughtContent = (currentStep as any).content?.filter(c => c.type === 'thinking')
      .map(c => c.thinking)
      .join(" ");

    if (thoughtContent) {
      // Simple heuristic: Look for placeholders like ${variableName}
      const dependencyRegex = /\$\{(\w+)\}/g;
      let match: RegExpExecArray | null = null;
      let matchCount = 0;

      while ((match = dependencyRegex.exec(thoughtContent)) !== null) {
        const dependencyVar = match[1];
        matchCount++;

        let foundDefinition = false;

        // Check preceding steps for definition
        for (const prevStep of precedingSteps) {
          const prevContent = (prevStep as any).content?.filter(c => c.type === 'thinking');
          if (prevContent) {
            const prevThought = prevContent.map(c => c.thinking).join(" ");
            if (prevThought.includes(dependencyVar)) {
              foundDefinition = true;
              break;
            }
          }
        }

        // Check succeeding steps for definition (Forward reference check)
        if (!foundDefinition) {
          for (const nextStep of succeedingSteps) {
            const nextContent = (nextStep as any).content?.filter(c => c.type === 'thinking');
            if (nextContent) {
              const nextThought = nextContent.map(c => c.thinking).join(" ");
              if (nextThought.includes(dependencyVar)) {
                // Found a definition in a future step, which is a potential error if the dependency must be resolved sequentially.
                // For this advanced validator, we flag it as a potential out-of-order dependency.
                errors.push(`Dependency '${dependencyVar}' in step ${currentStepIndex} references a variable defined in a subsequent step.`);
                foundDefinition = true; // Mark as found to prevent double-counting if we only want to flag *unresolved* dependencies.
                break;
              }
            }
          }
        }

        if (!foundDefinition) {
          errors.push(`Unresolved dependency '${dependencyVar}' found in step ${currentStepIndex}. It must be defined in a preceding step.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}