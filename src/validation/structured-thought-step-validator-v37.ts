import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface StepSchema {
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface StructuredThoughtValidator {
  validateSequence(
    steps: Array<{ input: unknown; output: unknown }>,
    schema: Array<StepSchema>
  ): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV37 implements StructuredThoughtValidator {
  validateSequence(
    steps: Array<{ input: unknown; output: unknown }>,
    schema: Array<StepSchema>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let stepIndex = 0;

    if (steps.length !== schema.length) {
      errors.push(
        `Mismatch in length: Expected ${schema.length} steps based on schema, but received ${steps.length} steps.`
      );
      return { isValid: false, errors };
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const schemaDef = schema[i];

      // 1. Validate current step input against its defined input schema
      if (!this.validateStepInput(step.input, schemaDef.inputSchema, i)) {
        // Error logged inside validateStepInput
      }

      // 2. Validate current step output against its defined output schema
      if (!this.validateStepOutput(step.output, schemaDef.outputSchema, i)) {
        // Error logged inside validateStepOutput
      }

      // 3. Cross-step validation: Output of step N must match input expectation of step N+1
      if (i < steps.length - 1) {
        const nextStepSchema = schema[i + 1];
        const currentStepOutput = step.output;

        if (!this.validateOutputToNextInput(
          currentStepOutput,
          nextStepSchema.inputSchema,
          i,
          i + 1
        )) {
          // Error logged inside validateOutputToNextInput
        }
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }

  private validateStepInput(
    input: unknown,
    schema: Record<string, any>,
    stepIndex: number
  ): boolean {
    let isValid = true;
    for (const key in schema) {
      const expectedType = schema[key];
      if (typeof input !== 'object' || input === null) {
        if (expectedType !== 'any') {
          // Skip deep validation if input structure is wrong
          return false;
        }
      } else if (!(key in input)) {
        if (expectedType !== 'optional') {
          // Missing required field
          console.error(
            `Validation Error at Step ${stepIndex}: Input missing required field '${key}'.`
          );
          isValid = false;
        }
      } else {
        const actualValue = (input as Record<string, unknown>)[key];
        // Basic type check simulation
        if (typeof actualValue !== expectedType && expectedType !== 'any') {
          console.error(
            `Validation Error at Step ${stepIndex}: Field '${key}' expected type ${expectedType}, got ${typeof actualValue}.`
          );
          isValid = false;
        }
      }
    }
    return isValid;
  }

  private validateStepOutput(
    output: unknown,
    schema: Record<string, any>,
    stepIndex: number
  ): boolean {
    return this.validateStepInput(output, schema, stepIndex);
  }

  private validateOutputToNextInput(
    currentOutput: unknown,
    nextInputSchema: Record<string, any>,
    currentStepIndex: number,
    nextStepIndex: number
  ): boolean {
    let isValid = true;
    for (const key in nextInputSchema) {
      const expectedType = nextInputSchema[key];
      if (typeof currentOutput !== 'object' || currentOutput === null) {
        if (expectedType !== 'any') {
          return false;
        }
      } else if (!(key in currentOutput)) {
        if (expectedType !== 'optional') {
          console.error(
            `Cross-Step Validation Error: Step ${currentStepIndex} output missing required field '${key}' needed by Step ${nextStepIndex} input.`
          );
          isValid = false;
        }
      } else {
        const actualValue = (currentOutput as Record<string, unknown>)[key];
        if (typeof actualValue !== expectedType && expectedType !== 'any') {
          console.error(
            `Cross-Step Validation Error: Step ${currentStepIndex} output field '${key}' type mismatch. Expected ${expectedType} for Step ${nextStepIndex}, got ${typeof actualValue}.`
          );
          isValid = false;
        }
      }
    }
    return isValid;
  }
}