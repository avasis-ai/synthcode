import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

type ValidationStep = (
  context: Record<string, unknown>;
  input: Record<string, unknown>;
  schema: Record<string, any>
) => {
  result: ValidationResult;
  updateContext: (context: Record<string, unknown>) => Record<string, unknown>;
};

interface ValidationStepFactory {
  (name: string): (context: Record<string, unknown>; input: Record<string, unknown>; schema: Record<string, any>) => ValidationStep;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];

  private constructor() {}

  private static instance(): StructuredToolInputValidationPipeline {
    if (!StructuredToolInputValidationPipeline.instance) {
      StructuredToolInputValidationPipeline.instance = new StructuredToolInputValidationPipeline();
    }
    return StructuredToolInputValidationPipeline.instance;
  }

  public static instance(): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.instance();
  }

  public addStep(step: ValidationStep): void {
    this.steps.push(step);
  }

  public buildPipeline(
    stepFactories: ValidationStepFactory[]
  ): (
    input: Record<string, unknown>;
    schema: Record<string, any>
  ) => ValidationResult => {
    const pipelineSteps: ValidationStep[] = stepFactories.map((factory) =>
      (context: Record<string, unknown>; input: Record<string, unknown>; schema: Record<string, any>) => {
        return factory(context.get('stepName') || 'anonymous')(context, input, schema);
      }
    );

    return (input: Record<string, unknown>; schema: Record<string, any>): ValidationResult => {
      let currentContext: Record<string, unknown> = {
        stepName: 'initial',
        ...{}
      };
      let accumulatedErrors: string[] = [];

      for (const step of pipelineSteps) {
        const stepResult = step(currentContext, input, schema);

        accumulatedErrors = accumulatedErrors.concat(stepResult.result.errors);
        currentContext = stepResult.updateContext(currentContext);
      }

      return {
        isValid: accumulatedErrors.length === 0,
        errors: accumulatedErrors,
        context: currentContext,
      };
    };
  }
}

export const RequiredFieldStepFactory: ValidationStepFactory = (name) =>
  (context, input, schema) => {
    const requiredFields = schema.required || [];
    const errors: string[] = [];
    const contextUpdate: (c: Record<string, unknown>) => Record<string, unknown> = (c) => ({
      ...c,
      lastCheckedFields: requiredFields,
    });

    for (const field of requiredFields) {
      if (!(field in input) || input[field] === null || input[field] === undefined || (typeof input[field] === 'string' && input[field].trim() === '')) {
        errors.push(`Field '${field}' is required.`);
      }
    }

    return {
      result: {
        isValid: errors.length === 0,
        errors: errors,
        context: { ...context, ...{} },
      },
      updateContext: contextUpdate,
    };
  };

export const CrossFieldDependencyStepFactory: ValidationStepFactory = (name) =>
  (context, input, schema) => {
    const dependencies: Record<string, { dependsOn: string; condition: (a: unknown, b: unknown) => boolean; message: string }[]> = schema.dependencies || {};
    const errors: string[] = [];
    const contextUpdate: (c: Record<string, unknown>) => Record<string, unknown> = (c) => ({
      ...c,
      lastCheckedDependencies: dependencies,
    });

    for (const field in dependencies) {
      const deps = dependencies[field];
      for (const dep of deps) {
        const valueA = input[field];
        const valueB = input[dep.dependsOn];

        if (valueA !== undefined && valueB !== undefined && !dep.condition(valueA, valueB)) {
          errors.push(`${field} depends on ${dep.dependsOn}, but the condition failed: ${dep.message}`);
        }
      }
    }

    return {
      result: {
        isValid: errors.length === 0,
        errors: errors,
        context: { ...context, ...{} },
      },
      updateContext: contextUpdate,
    };
  };

export const buildPipeline = (
  stepFactories: ValidationStepFactory[]
): (
  input: Record<string, unknown>;
  schema: Record<string, any>
) => ValidationResult => {
  const pipeline = StructuredToolInputValidationPipeline.instance();
  stepFactories.forEach((factory) => {
    pipeline.addStep(factory('step'));
  });
  return pipeline.buildPipeline();
};