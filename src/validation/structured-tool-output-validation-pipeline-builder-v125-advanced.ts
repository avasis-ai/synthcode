import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStepFunction = (context: Map<string, any>, input: any) => { result: any; contextUpdate: Partial<Record<string, any>> };

interface AdvancedValidator {
  execute: (context: Map<string, any>, input: any) => { result: any; contextUpdate: Partial<Record<string, any>> };
}

abstract class BaseValidationBuilder {
  protected steps: ValidationStepFunction[] = [];
  protected advancedValidators: AdvancedValidator[] = [];

  public addStep(step: ValidationStepFunction): this {
    this.steps.push(step);
    return this;
  }

  public addAdvancedValidator(validator: AdvancedValidator): this {
    this.advancedValidators.push(validator);
    return this;
  }

  public getValidationPipeline(): { steps: ValidationStepFunction[]; advancedValidators: AdvancedValidator[] } {
    return { steps: this.steps, advancedValidators: this.advancedValidators };
  }
}

export class StructuredToolOutputValidationPipelineBuilderV125Advanced extends BaseValidationBuilder {
  private constructor() {
    super();
  }

  public static getInstance(): StructuredToolOutputValidationPipelineBuilderV125Advanced {
    if (!StructuredToolOutputValidationPipelineBuilderV125Advanced.instance) {
      StructuredToolOutputValidationPipelineBuilderV125Advanced.instance = new StructuredToolOutputValidationPipelineBuilderV125Advanced();
    }
    return StructuredToolOutputValidationPipelineBuilderV125Advanced.instance;
  }

  private static instance: StructuredToolOutputValidationPipelineBuilderV125Advanced;

  /**
   * Registers a custom validator that can perform cross-step dependency checks
   * and manage complex state transitions.
   * @param validator The advanced validator implementation.
   * @returns The builder instance for chaining.
   */
  public addCrossStepValidator(validator: AdvancedValidator): this {
    return super.addAdvancedValidator(validator);
  }

  /**
   * Builds the final, advanced validation pipeline configuration.
   * @returns An object containing sequential steps and advanced validators.
   */
  public build(): { steps: ValidationStepFunction[]; advancedValidators: AdvancedValidator[] } {
    return super.getValidationPipeline();
  }
}