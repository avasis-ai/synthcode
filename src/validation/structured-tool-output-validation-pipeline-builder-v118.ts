import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

type ValidatorType = "type" | "regex" | "required" | "custom";

interface ValidatorConfig {
  type: ValidatorType;
  schema?: Record<string, any>;
  field: string;
  value?: any;
  errorMessage: string;
}

interface StepConfig {
  name: string;
  validator: ValidatorConfig;
  dependsOn?: string;
}

interface ValidationStep {
  execute: (data: Record<string, any>, context: Record<string, any>) => {
    isValid: boolean;
    errors: string[];
  };
}

export class StructuredToolOutputValidationPipelineBuilder {
  private targetSchema: Record<string, any>;
  private pipelineSteps: ValidationStep[] = [];
  private stepConfigs: StepConfig[] = [];

  constructor(targetSchema: Record<string, any>) {
    this.targetSchema = targetSchema;
  }

  addValidator(validator: ValidatorConfig): this {
    this.stepConfigs.push({
      name: `Validator_${Date.now()}_${Math.random()}`,
      validator: validator,
    });
    return this;
  }

  addStep(config: StepConfig): this {
    this.stepConfigs.push(config);
    return this;
  }

  private createValidatorStep(config: StepConfig): ValidationStep {
    const { validator } = config;

    return {
      execute: (data: Record<string, any>, context: Record<string, any>): {
        isValid: boolean;
        errors: string[];
      } => {
        const errors: string[] = [];
        let isValid = true;

        switch (validator.type) {
          case "type":
            if (typeof data[validator.field] !== 'undefined' && typeof data[validator.field] !== typeof validator.schema?.type) {
              errors.push(validator.errorMessage || `Field ${validator.field} must be of type ${validator.schema?.type}.`);
              isValid = false;
            }
            break;
          case "regex":
            if (typeof data[validator.field] === 'string' && !new RegExp(validator.schema?.pattern || "", "i").test(data[validator.field])) {
              errors.push(validator.errorMessage || `Field ${validator.field} does not match required pattern.`);
              isValid = false;
            }
            break;
          case "required":
            if (typeof data[validator.field] === 'undefined' || data[validator.field] === null || String(data[validator.field] || '').trim() === "") {
              errors.push(validator.errorMessage || `Field ${validator.field} is required.`);
              isValid = false;
            }
            break;
          case "custom":
            // Placeholder for complex custom logic using context
            if (validator.value && !validator.value(data, context)) {
              errors.push(validator.errorMessage || `Custom validation failed for field ${validator.field}.`);
              isValid = false;
            }
            break;
        }

        return { isValid, errors };
      },
    };
  }

  build(): {
    run: (data: Record<string, any>, context: Record<string, any>): {
      isValid: boolean;
      errors: string[];
    };
    initialContext: Record<string, any>;
  } {
    const pipelineSteps: ValidationStep[] = [];
    const executionOrder: string[] = [];

    // Simple topological sort simulation for demonstration
    // In a real scenario, this would handle complex dependency graphs.
    // Here, we process in the order added, assuming dependencies are met or handled by context.
    this.stepConfigs.forEach(config => {
      if (config.dependsOn) {
        // Skip dependency resolution for simplicity, assume sequential execution is sufficient
      }
      pipelineSteps.push(this.createValidatorStep(config));
      executionOrder.push(config.name);
    });

    const runPipeline = (data: Record<string, any>, context: Record<string, any>): {
      isValid: boolean;
      errors: string[];
    } => {
      let currentContext = { ...context };
      const allErrors: string[] = [];
      let overallValid = true;

      for (const step of pipelineSteps) {
        const result = step.execute(data, currentContext);
        if (!result.isValid) {
          overallValid = false;
          allErrors.push(...result.errors);
        }
      }

      return {
        isValid: overallValid,
        errors: allErrors,
      };
    };

    return {
      run: runPipeline,
      initialContext: {}
    };
  }
}