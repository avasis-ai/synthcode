import {
  Message,
  ContentBlock,
  ThinkingBlock,
} from "./types";

export interface ThoughtSchema {
  requiredSteps: number;
  stepSchema: {
    type: "thinking";
    requiredFields: string[];
    dependencies?: Record<string, string>;
  }[];
}

export interface StructuredThoughtValidator {
  validate(thought: { steps: ContentBlock[] }, schema: ThoughtSchema): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV14 implements StructuredThoughtValidator {
  validate(thought: { steps: ContentBlock[] }, schema: ThoughtSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let currentStepIndex = 0;

    if (thought.steps.length < schema.requiredSteps) {
      errors.push(`Thought process must contain at least ${schema.requiredSteps} steps, but found ${thought.steps.length}.`);
    }

    for (let i = 0; i < Math.min(thought.steps.length, schema.stepSchema.length); i++) {
      const step = thought.steps[i];
      const schemaStep = schema.stepSchema[i];

      if (!step || step.type !== "thinking") {
        errors.push(`Step ${i + 1}: Expected a ThinkingBlock, but found ${step ? step.type : 'null'}.`);
        continue;
      }

      const thinkingBlock = step as ThinkingBlock;
      const thinkingContent = thinkingBlock.thinking;

      // 1. Check required fields
      for (const field of schemaStep.requiredFields) {
        if (!thinkingContent || typeof thinkingContent !== "string" || thinkingContent.trim().length === 0) {
          errors.push(`Step ${i + 1}: Missing or empty required field: ${field}.`);
        }
      }

      // 2. Check cross-step dependencies (simplified check based on schema definition)
      if (schemaStep.dependencies) {
        for (const [dependencyField, requiredSourceStepIndex] of Object.entries(schemaStep.dependencies)) {
          if (requiredSourceStepIndex >= 0 && requiredSourceStepIndex < i) {
            const sourceStep = thought.steps[requiredSourceStepIndex];
            if (!sourceStep || sourceStep.type !== "thinking") {
              errors.push(`Step ${i + 1}: Dependency check failed. Source step ${requiredSourceStepIndex + 1} is invalid.`);
              continue;
            }
            // In a real scenario, we'd parse the dependencyField from the source step's content.
            // For this implementation, we just check existence.
            if (!thinkingContent.includes(dependencyField)) {
               errors.push(`Step ${i + 1}: Dependency check failed. Must reference content from step ${requiredSourceStepIndex + 1} regarding '${dependencyField}'.`);
            }
          }
        }
      }

      currentStepIndex = i + 1;
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}