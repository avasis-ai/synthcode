import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ConstraintResult = {
  isValid: boolean;
  errors: string[];
};

interface ContextualConstraintValidator {
  validate(context: Record<string, any>, data: any): ConstraintResult;
}

interface TemporalConstraint extends ContextualConstraintValidator {
  validate(context: Record<string, any>, data: any): ConstraintResult;
}

interface ResourceConstraint extends ContextualConstraintValidator {
  validate(context: Record<string, any>, data: any): ConstraintResult;
}

interface StateConstraint extends ContextualConstraintValidator {
  validate(context: Record<string, any>, data: any): ConstraintResult;
}

type ConstraintValidatorChain = ContextualConstraintValidator[];

class ContextualConstraintValidatorChain {
  private validators: ConstraintValidatorChain;

  constructor(validators: ConstraintValidatorChain) {
    this.validators = validators;
  }

  public execute(context: Record<string, any>, data: any): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context, data);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }
}

export class ContextualConstraintValidatorAdvancedAdvanced {
  private static buildChain(
    temporal: TemporalConstraint | null,
    resource: ResourceConstraint | null,
    state: StateConstraint | null
  ): ContextualConstraintValidatorChain {
    const validators: ConstraintValidatorChain = [];
    if (temporal) {
      validators.push(temporal);
    }
    if (resource) {
      validators.push(resource);
    }
    if (state) {
      validators.push(state);
    }
    return validators;
  }

  public static createChain(
    temporal: TemporalConstraint | null = null,
    resource: ResourceConstraint | null = null,
    state: StateConstraint | null = null
  ): ContextualConstraintValidatorChain {
    return new ContextualConstraintValidatorChain(
      this.buildChain(temporal, resource, state)
    );
  }
}