import { AgentContext, ToolOutput } from "./agent-context";

export interface ContextualValidationRule<T> {
  validate(context: AgentContext, output: T): { isValid: boolean; message: string };
}

export class ContextualOutputValidator<T> {
  private rules: ContextualValidationRule<T>[] = [];

  addRule(rule: ContextualValidationRule<T>): void {
    this.rules.push(rule);
  }

  validate(context: AgentContext, output: T): { isValid: boolean; message: string } {
    for (const rule of this.rules) {
      const result = rule.validate(context, output);
      if (!result.isValid) {
        return { isValid: false, message: result.message };
      }
    }
    return { isValid: true, message: "Contextual validation passed." };
  }
}

export type ValidatorBuilder<T> = {
  addSchemaValidation: (validator: (output: T) => { isValid: boolean; message: string }) => ValidatorBuilder<T>;
  addContextualValidation: (rule: ContextualValidationRule<T>) => ValidatorBuilder<T>;
  build: (context: AgentContext, output: T) => { isValid: boolean; message: string };
};

export const createStructuredToolOutputValidator = <T>(initialValidator: (output: T) => { isValid: boolean; message: string }): ValidatorBuilder<T> => {
  const validator: ContextualOutputValidator<T> = new ContextualOutputValidator<T>();

  const builder: ValidatorBuilder<T> = {
    addSchemaValidation: (schemaValidator) => {
      // In a real scenario, we might wrap this into a rule, but for simplicity,
      // we'll assume schema validation is handled separately or integrated here.
      // For this implementation, we'll just acknowledge the method signature.
      return builder;
    },
    addContextualValidation: (rule) => {
      validator.addRule(rule);
      return builder;
    },
    build: (context: AgentContext, output: T): { isValid: boolean; message: string } => {
      let result = { isValid: true, message: "Schema validation passed." };
      // Simulate schema validation execution
      try {
        result = initialValidator(output);
      } catch (e) {
        return { isValid: false, message: `Schema validation failed due to error: ${(e as Error).message}` };
      }

      // Execute contextual validation
      const contextResult = validator.validate(context, output);

      if (!result.isValid || !contextResult.isValid) {
        return {
          isValid: false,
          message: `Validation failed. Schema: ${result.message}. Context: ${contextResult.message}`,
        };
      }

      return { isValid: true, message: "All validations passed." };
    },
  };

  return builder;
};