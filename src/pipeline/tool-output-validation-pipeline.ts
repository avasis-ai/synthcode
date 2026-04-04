import { Message } from "./message";

export interface Validator {
  validate(input: any): Promise<{ isValid: boolean; output: any; error?: string }>;
}

export class ToolOutputValidationPipeline {
  private validators: Validator[];

  constructor(validators: Validator[] = []) {
    this.validators = validators;
  }

  async run(input: any): Promise<{ isValid: boolean; output: any; error?: string }> {
    let currentOutput: any = input;

    for (const validator of this.validators) {
      const result = await validator.validate(currentOutput);

      if (!result.isValid) {
        return { isValid: false, output: currentOutput, error: result.error };
      }

      currentOutput = result.output;
    }

    return { isValid: true, output: currentOutput };
  }
}