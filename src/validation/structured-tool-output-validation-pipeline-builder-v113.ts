import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationContext {
  data: Record<string, unknown>;
  history: Message[];
}

interface ValidatorStep {
  execute: (context: ValidationContext) => {
    isValid: boolean;
    errors: string[];
    context: ValidationContext;
  };
}

class StructuredToolOutputValidationPipelineBuilder {
  private schema: Record<string, any>;
  private initialContext: ValidationContext;
  private steps: ValidatorStep[] = [];
  private crossFieldChecks: ValidatorStep[] = [];
  private temporalChecks: ValidatorStep[] = [];

  constructor(schema: Record<string, any>, initialContext: ValidationContext) {
    this.schema = schema;
    this.initialContext = initialContext;
  }

  addStep(step: ValidatorStep): this {
    this.steps.push(step);
    return this;
  }

  addCrossFieldCheck(step: ValidatorStep): this {
    this.crossFieldChecks.push(step);
    return this;
  }

  addTemporalCheck(step: ValidatorStep): this {
    this.temporalChecks.push(step);
    return this;
  }

  buildPipeline(): {
    execute: (data: Record<string, unknown>, history: Message[]) => {
      const context: ValidationContext = {
        data: data,
        history: history,
      };

      let currentContext = { ...context, data: { ...context.data } };

      const runSteps = (steps: ValidatorStep[], current: ValidationContext): {
        isValid: boolean;
        errors: string[];
        context: ValidationContext;
      } => {
        let allErrors: string[] = [];
        let currentValidContext: ValidationContext = { ...current, data: { ...current.data } };

        for (const step of steps) {
          const result = step.execute(currentValidContext);
          allErrors.push(...result.errors);
          currentValidContext = result.context;
          if (!result.isValid) {
            break;
          }
        }
        return {
          isValid: allErrors.length === 0,
          errors: allErrors,
          context: currentValidContext,
        };
      };

      const stepResults = runSteps(this.steps, { ...context, data: { ...context.data } });
      const crossFieldResults = runSteps(this.crossFieldChecks, { ...context, data: { ...context.data } });
      const temporalResults = runSteps(this.temporalChecks, { ...context, data: { ...context.data } });

      const finalErrors: string[] = [...(stepResults.errors || []), ...(crossFieldResults.errors || []), ...(temporalResults.errors || [])];
      const overallIsValid = finalErrors.length === 0;

      return {
        execute: (data: Record<string, unknown>, history: Message[]): {
          isValid: boolean;
          errors: string[];
          context: ValidationContext;
        } => {
          const finalContext: ValidationContext = {
            data: data,
            history: history,
          };

          const finalStepResults = runSteps(this.steps, { ...finalContext, data: { ...finalContext.data } });
          const finalCrossFieldResults = runSteps(this.crossFieldChecks, { ...finalContext, data: { ...finalContext.data } });
          const finalTemporalResults = runSteps(this.temporalChecks, { ...finalContext, data: { ...finalContext.data } });

          const finalErrorsList: string[] = [...(finalStepResults.errors || []), ...(finalCrossFieldResults.errors || []), ...(finalTemporalResults.errors || [])];

          return {
            isValid: finalErrorsList.length === 0,
            errors: finalErrorsList,
            context: finalStepResults.context,
          };
        },
      };
    }
}

export { StructuredToolOutputValidationPipelineBuilder };