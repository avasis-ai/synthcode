import { Message, ToolResultMessage } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

interface ValidationStep {
  execute: (input: Record<string, unknown>) => Promise<ValidationResult>;
  dependencies: string[];
}

interface ConditionalStep {
  condition: (input: Record<string, unknown>) => boolean;
  step: ValidationStep;
}

class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private conditionalSteps: ConditionalStep[] = [];
  private stepNames: Map<string, ValidationStep | ConditionalStep> = new Map();

  addStep(name: string, step: ValidationStep): this {
    this.steps.push(step);
    this.stepNames.set(name, step);
    return this;
  }

  addConditionalStep(name: string, condition: (input: Record<string, unknown>) => boolean, step: ValidationStep): this {
    this.conditionalSteps.push({ condition, step });
    this.stepNames.set(name, {
      execute: async (input: Record<string, unknown>) => {
        if (condition(input)) {
          return step.execute(input);
        }
        return { isValid: true, errors: [], data: input };
      },
      dependencies: step.dependencies,
    } as ValidationStep);
    return this;
  }

  buildPipeline(): {
    execute: (input: Record<string, unknown>) => Promise<ValidationResult>;
  } {
    const allSteps: (ValidationStep | ConditionalStep)[] = [...this.steps, ...this.conditionalSteps];

    const executePipeline = async (initialInput: Record<string, unknown>): Promise<ValidationResult> => {
      let currentData: Record<string, unknown> = { ...initialInput };
      let results: ValidationResult = { isValid: true, errors: [], data: { ...initialInput } };
      const executedStepNames = new Set<string>();

      const processStep = async (stepName: string, step: ValidationStep | ConditionalStep): Promise<void> => {
        if (executedStepNames.has(stepName)) return;

        let result: ValidationResult;
        if (stepName.startsWith("conditional_")) {
          const conditionalStep = step as ConditionalStep;
          result = await conditionalStep.step.execute(currentData);
        } else {
          result = await step.execute(currentData);
        }

        results.isValid = results.isValid && result.isValid;
        results.errors = [...results.errors, ...(result.errors || [])];
        results.data = { ...results.data, ...(result.data || {}) };
        executedStepNames.add(stepName);
      };

      // Simple topological sort simulation for demonstration; real implementation needs robust dependency graph resolution.
      // For this builder, we execute in the order added, respecting dependencies if possible.
      const sortedStepNames = [...this.steps.map(s => s.name), ...this.conditionalSteps.map(c => c.name)];

      for (const stepName of sortedStepNames) {
        const step = this.stepNames.get(stepName)!;

        // Check dependencies (simplified: only run if all dependencies are met/run)
        const dependenciesMet = step.dependencies.every(dep => executedStepNames.has(dep));

        if (dependenciesMet) {
          await processStep(stepName, step);
        }
      }

      return results;
    };

    return {
      execute: executePipeline,
    };
  }
}

export { StructuredToolOutputValidationPipelineBuilder };