import { Validator } from "./validator-chain";

export class StructuredToolOutputValidationChainBuilder {
  private readonly targetSchema: any;
  private validationSteps: Validator[] = [];

  constructor(targetSchema: any) {
    this.targetSchema = targetSchema;
  }

  addStep(validator: Validator): this {
    this.validationSteps.push(validator);
    return this;
  }

  build(): Validator {
    return new ValidatorChain(this.validationSteps, this.targetSchema);
  }
}