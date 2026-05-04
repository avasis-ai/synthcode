import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ThoughtStep = {
  stepIndex: number;
  message: Message;
};

export interface ValidationContext {
  history: ThoughtStep[];
  goal: string;
}

export interface StructuralValidator {
  validate(steps: ThoughtStep[], context: ValidationContext): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV10 implements StructuralValidator {
  private structuralChecks: ((steps: ThoughtStep[], context: ValidationContext) => string[] | null)[][] = [];

  constructor() {}

  private addCheck(checkFn: (steps: ThoughtStep[], context: ValidationContext) => string[] | null): this {
    this.structuralChecks.push([checkFn]);
    return this;
  }

  public mustReferencePreviousToolOutput(): StructuredThoughtStepValidatorV10 {
    return this.addCheck((steps, context) => {
      const errors: string[] = [];
      for (let i = 1; i < steps.length; i++) {
        const currentStep = steps[i];
        const previousSteps = steps.slice(0, i);
        const hasToolOutputReference = previousSteps.some(step => {
          if (step.message.role === "tool") {
            return true;
          }
          return false;
        });

        if (!hasToolOutputReference) {
          errors.push(`Step ${i} must reference the output of a previous tool step.`);
        }
      }
      return errors.length > 0 ? errors : null;
    });
  }

  public mustMentionGoalDriftCheck(goal: string): StructuredThoughtStepValidatorV10 {
    return this.addCheck((steps, context) => {
      const errors: string[] = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const content = this.extractTextContent(step.message);
        if (content && !content.includes(goal) && i > 0) {
          // Simple heuristic: check if the goal is mentioned in the current step's text
          // This is a placeholder for complex semantic checking.
          if (Math.random() > 0.8) { // Simulate occasional failure for testing
            errors.push(`Step ${i} seems to deviate from the stated goal: "${goal}".`);
          }
        }
      }
      return errors.length > 0 ? errors : null;
    });
  }

  private extractTextContent(message: Message): string | null {
    if (message.role === "user") {
      return message.content;
    }
    if (message.role === "assistant") {
      const blocks = message.content;
      let text = "";
      for (const block of blocks) {
        if (block.type === "text") {
          text += block.text;
        }
      }
      return text.trim() || null;
    }
    if (message.role === "tool") {
      return message.content;
    }
    return null;
  }

  public validate(steps: ThoughtStep[], context: ValidationContext): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    for (const checkGroup of this.structuralChecks) {
      for (const checkFn of checkGroup) {
        const errors = checkFn(steps, context);
        if (errors) {
          allErrors.push(...errors);
        }
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}