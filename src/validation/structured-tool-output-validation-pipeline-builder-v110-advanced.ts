import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
};

type ValidatorFunction = (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => ValidationResult;

type ContextEnricher = (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => Record<string, unknown>;

export class StructuredToolOutputValidationPipelineBuilderAdvanced {
  private validators: ValidatorFunction[] = [];
  private contextEnrichers: ContextEnricher[] = [];

  constructor() {}

  addSchemaValidator(validator: (data: Record<string, unknown>) => boolean): this {
    this.validators.push((input, context) => {
      const isValid = validator(input);
      return {
        isValid: isValid,
        errors: isValid ? [] : ["Schema validation failed"],
        context: context,
      };
    });
    return this;
  }

  addCrossFieldValidator(validator: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult): this {
    this.validators.push(validator);
    return this;
  }

  addContextEnricher(enricher: ContextEnricher): this {
    this.contextEnrichers.push(enricher);
    return this;
  }

  private executeValidators(input: Record<string, unknown>, initialContext: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = { ...initialContext };
    let allErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      const result = validator(input, currentContext);
      if (!result.isValid) {
        overallValid = false;
        allErrors = allErrors.concat(result.errors);
      }
      if (result.context) {
        currentContext = { ...currentContext, ...result.context };
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      context: currentContext,
    };
  }

  private executeContextEnrichers(input: Record<string, unknown>, initialContext: Record<string, unknown>): Record<string, unknown> {
    let currentContext: Record<string, unknown> = { ...initialContext };
    for (const enricher of this.contextEnrichers) {
      const newContext = enricher(input, currentContext);
      currentContext = { ...currentContext, ...newContext };
    }
    return currentContext;
  }

  build(inputData: Record<string, unknown>, initialContext: Record<string, unknown> = {}): {
    finalResult: ValidationResult;
    finalContext: Record<string, unknown>;
  } {
    const contextAfterEnrichment = this.executeContextEnrichers(inputData, initialContext);
    const validationResult = this.executeValidators(inputData, contextAfterEnrichment);

    return {
      finalResult: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        context: validationResult.context || contextAfterEnrichment,
      },
      finalContext: contextAfterEnrichment,
    };
  }
}