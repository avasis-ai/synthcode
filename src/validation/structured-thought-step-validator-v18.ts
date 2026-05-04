import { Message, ContentBlock, ThinkingBlock } from "./types";

interface StepContext {
  currentStep: any;
  previousStep: any;
}

export class StructuredThoughtStepValidatorV18 {
  validate(context: StepContext): { isValid: boolean; errors: string[] } {
    const { currentStep, previousStep } = context;
    const errors: string[] = [];

    if (!currentStep || !previousStep) {
      return { isValid: false, errors: ["Missing current or previous step context."] };
    }

    // Basic check for required structure fields (assuming 'source' and 'reasoning' are expected)
    if (typeof currentStep.source !== 'string' || currentStep.source.length === 0) {
      errors.push("Current step is missing a required 'source' identifier.");
    }

    // Core cross-reference validation: Check if the current step's source references the previous step's output.
    if (previousStep && previousStep.output_id) {
      const expectedSource = previousStep.output_id;
      if (currentStep.source !== expectedSource) {
        errors.push(
          `Logical inconsistency: Current step source '${currentStep.source}' does not match expected source from previous step ('${expectedSource}').`
        );
      }
    }

    // Specific check for 'reasoning' steps requiring a preceding 'observation'
    if (currentStep.type === 'reasoning' && !previousStep || previousStep.type !== 'observation') {
      errors.push("Reasoning step requires a preceding 'observation' step for context.");
    }

    // Check for mandatory content if the step is not purely informational
    if (currentStep.type === 'final_output' && (!currentStep.content || currentStep.content.length === 0)) {
      errors.push("Final output step must contain content.");
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}