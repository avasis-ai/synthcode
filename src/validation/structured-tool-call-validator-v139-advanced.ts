import {
  Message,
  ToolUseBlock,
  ToolResultMessage,
} from "./types";

export interface ToolCallSequenceValidator {
  validateSequence(
    toolCalls: {
      toolName: string;
      input: Record<string, unknown>;
      // Schema derived from the tool definition, used for validation
      outputSchema?: Record<string, any>;
    }[],
    context: {
      previousToolOutput?: Record<string, unknown>;
      // A map of tool names to their expected input/output schemas
      toolSchemas: Record<string, { input: Record<string, any>; output: Record<string, any> }>;
    }
  ): { isValid: boolean; errors: string[] };
}

export class StructuredToolCallValidatorV139Advanced implements ToolCallSequenceValidator {
  validateSequence(
    toolCalls: {
      toolName: string;
      input: Record<string, unknown>;
      outputSchema?: Record<string, any>;
    }[],
    context: {
      previousToolOutput?: Record<string, unknown>;
      toolSchemas: Record<string, { input: Record<string, any>; output: Record<string, any> }>;
    }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let currentContext: Record<string, unknown> | undefined = context.previousToolOutput;

    if (!toolCalls || toolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < toolCalls.length; i++) {
      const call = toolCalls[i];
      const toolSchemas = context.toolSchemas;

      if (!toolSchemas[call.toolName]) {
        errors.push(`Tool "${call.toolName}" is not defined in the provided schemas.`);
        continue;
      }

      // 1. Validate input against the expected schema
      const expectedInput = toolSchemas[call.toolName].input;
      const inputErrors = this.validateInput(call.input, expectedInput);
      if (inputErrors.length > 0) {
        errors.push(`Step ${i + 1} (${call.toolName}): Invalid input provided. Errors: ${inputErrors.join(', ')}`);
        continue;
      }

      // 2. Contextual validation (N -> N+1)
      if (i > 0) {
        const previousCall = toolCalls[i - 1];
        const previousToolSchemas = toolSchemas[previousCall.toolName];

        if (previousToolSchemas && previousToolSchemas.output && currentContext !== undefined) {
          // Logic: Check if the output of the previous step constrains the current input
          // This is a simplified check: ensuring required fields from the previous output
          // are present or match types expected by the current tool's input schema.
          const requiredContextFields = this.getRequiredContextFields(call.toolName, toolSchemas);
          for (const field of requiredContextFields) {
            if (typeof currentContext?.[field] === 'undefined' || currentContext[field] === null) {
              errors.push(
                `Step ${i + 1} (${call.toolName}): Missing required context field "${field}" derived from previous tool output.`
              );
            }
          }
        }
      }

      // 3. Simulate output and update context for the next step
      // In a real system, this would use the actual tool execution result.
      // Here, we assume the output is valid and update the context for the next iteration.
      currentContext = this.simulateToolOutput(call, toolSchemas[call.toolName].output);
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateInput(input: Record<string, unknown>, schema: Record<string, any>): string[] {
    const errors: string[] = [];
    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const expectedType = schema[key].type;
        const value = input[key];

        if (value === undefined || value === null) {
          if (schema[key].required) {
            errors.push(`Missing required field: ${key}`);
          }
          continue;
        }

        if (expectedType && typeof value !== expectedType) {
          errors.push(`Field "${key}" expected type ${expectedType}, but received ${typeof value}.`);
        }
      }
    }
    return errors;
  }

  private getRequiredContextFields(toolName: string, toolSchemas: Record<string, { input: Record<string, any>; output: Record<string, any> }>): string[] {
    const schema = toolSchemas[toolName];
    if (!schema || !schema.input) return [];

    const requiredFields: string[] = [];
    for (const key in schema.input) {
      if (Object.prototype.hasOwnProperty.call(schema.input, key) && schema.input[key].required) {
        requiredFields.push(key);
      }
    }
    return requiredFields;
  }

  private simulateToolOutput(call: { toolName: string; input: Record<string, unknown> }, outputSchema: Record<string, any>): Record<string, unknown> {
    // Mocking a successful output based on the output schema structure
    const output: Record<string, unknown> = {};
    for (const key in outputSchema) {
      if (Object.prototype.hasOwnProperty.call(outputSchema, key)) {
        const schema = outputSchema[key];
        // Mocking a value that satisfies the schema type
        if (schema.type === 'string') {
          output[key] = `mock_value_${key}`;
        } else if (schema.type === 'number') {
          output[key] = 123;
        } else {
          output[key] = null;
        }
      }
    }
    return output;
  }
}