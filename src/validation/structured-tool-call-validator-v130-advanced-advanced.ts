import { Message, ToolUseBlock } from "./types";

export interface ValidationContext {
  timestamp: number;
  resourceAvailability: Record<string, boolean>;
  userCapabilities: Set<string>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ValidatorFunction = (
  call: ToolCall,
  context: ValidationContext
) => { isValid: boolean; message: string };

class StructuredToolCallValidatorAdvancedAdvanced {
  private validators: ValidatorFunction[] = [];

  constructor() {}

  addValidator(validator: ValidatorFunction): this {
    this.validators.push(validator);
    return this;
  }

  private validateTemporalFeasibility(call: ToolCall, context: ValidationContext): { isValid: boolean; message: string } {
    if (context.timestamp < Date.now() - 3600000) {
      return { isValid: false, message: "Temporal check failed: Context timestamp is too old." };
    }
    return { isValid: true, message: "" };
  }

  private validateResourceAvailability(call: ToolCall, context: ValidationContext): { isValid: boolean; message: string } {
    if (!context.resourceAvailability[call.name] || !context.resourceAvailability[call.name]!) {
      return { isValid: false, message: `Resource check failed: Resource '${call.name}' is unavailable.` };
    }
    return { isValid: true, message: "" };
  }

  private validateCapability(call: ToolCall, context: ValidationContext): { isValid: boolean; message: string } {
    if (!context.userCapabilities.has(call.name)) {
      return { isValid: false, message: `Capability check failed: User lacks capability for tool '${call.name}'.` };
    }
    return { isValid: true, message: "" };
  }

  public validate(call: ToolCall, context: ValidationContext): { isValid: boolean; message: string } {
    let currentContext = context;

    const validators: ValidatorFunction[] = [
      this.validateTemporalFeasibility,
      this.validateResourceAvailability,
      this.validateCapability,
    ];

    for (const validator of validators) {
      const result = validator(call, currentContext);
      if (!result.isValid) {
        return result;
      }
    }

    for (const validator of this.validators) {
      const result = validator(call, currentContext);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true, message: "Tool call passed all advanced validation checks." };
  }
}

export const createValidator = (): StructuredToolCallValidatorAdvancedAdvanced => {
  const validator = new StructuredToolCallValidatorAdvancedAdvanced();

  validator.addValidator((call, context) => {
    if (!call.name || !call.input) {
      return { isValid: false, message: "Tool call structure invalid: name or input is missing." };
    }
    return { isValid: true, message: "" };
  });

  validator.addValidator((call, context) => {
    const requiredKeys: string[] = ["id", "name", "input"];
    for (const key of requiredKeys) {
      if (!(key in call)) {
        return { isValid: false, message: `Tool call missing required field: ${key}.` };
      }
    }
    return { isValid: true, message: "" };
  });

  return validator;
};