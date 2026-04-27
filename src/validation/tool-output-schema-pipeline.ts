import { Message } from "./types";

export interface ValidationError {
  stepName: string;
  message: string;
  details?: any;
}

export interface ValidationStep {
  name: string;
  validate: (output: any) => { isValid: boolean; error?: ValidationError };
}

export class ToolOutputSchemaPipeline {
  private readonly steps: ValidationStep[];
  private readonly schema: Record<string, any>;

  constructor(steps: ValidationStep[], schema: Record<string, any>) {
    this.steps = steps;
    this.schema = schema;
  }

  public validate(output: any): { isValid: boolean; result: any } {
    for (const step of this.steps) {
      const validationResult = step.validate(output);
      if (!validationResult.isValid) {
        return { isValid: false, result: validationResult.error };
      }
    }
    return { isValid: true, result: output };
  }
}