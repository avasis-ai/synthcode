import { Message } from "./types";

type Validator = (context: { messages: Message[] }) => boolean;

interface ValidatorConfig {
  validator: Validator;
  condition?: (context: { messages: Message[] }) => boolean;
  mandatory?: boolean;
}

export class ToolPreconditionValidatorChain {
  private validators: { validator: Validator; condition: (context: { messages: Message[] }) => boolean; mandatory: boolean }[];

  constructor(validators: { validator: Validator; condition: (context: { messages: Message[] }) => boolean; mandatory: boolean }[]) {
    this.validators = validators;
  }

  validate(context: { messages: Message[] }): boolean {
    for (const { validator, condition, mandatory } of this.validators) {
      const shouldRun = !condition || condition(context);

      if (shouldRun) {
        const passed = validator(context);
        if (!passed) {
          return false;
        }
      }
    }
    return true;
  }
}

export class ToolPreconditionValidatorChainBuilder {
  private configs: ValidatorConfig[] = [];

  addValidator(validator: Validator, condition?: (context: { messages: Message[] }) => boolean, mandatory: boolean = false): this {
    this.configs.push({ validator, condition, mandatory });
    return this;
  }

  build(): ToolPreconditionValidatorChain {
    const processedValidators: { validator: Validator; condition: (context: { messages: Message[] }) => boolean; mandatory: boolean }[] = [];

    for (const config of this.configs) {
      const { validator, condition, mandatory } = config;

      if (mandatory) {
        processedValidators.push({
          validator: validator,
          condition: condition || (() => true),
          mandatory: true,
        });
      } else if (!condition || (() => true)()) {
        processedValidators.push({
          validator: validator,
          condition: condition || (() => true),
          mandatory: false,
        });
      } else {
        // For non-mandatory validators with conditions, we only add it if the condition is always true (or we treat it as optional)
        // In a real scenario, we might want to collect the condition and only run it once, but for simplicity matching the builder pattern:
        processedValidators.push({
          validator: validator,
          condition: condition || (() => true),
          mandatory: false,
        });
      }
    }

    return new ToolPreconditionValidatorChain(processedValidators);
  }
}