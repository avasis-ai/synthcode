import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface AdvancedCallContext {
  previousToolOutput: Record<string, unknown> | null;
  causalityLinks: {
    sourceId: string;
    targetId: string;
    requiredContext: string;
  }[];
  intentMarkers: Record<string, string>;
}

export interface ToolCallSequence {
  calls: {
    toolName: string;
    input: Record<string, unknown>;
    context: AdvancedCallContext;
  }[];
}

export interface CausalityRule {
  check: (
    previousOutput: Record<string, unknown> | null,
    currentCall: {
      toolName: string;
      input: Record<string, unknown>;
      context: AdvancedCallContext;
    }
  ) => { isValid: boolean; reason?: string };
}

export class StructuredToolCallValidator {
  private rules: CausalityRule[] = [];

  constructor() {}

  addRule(rule: CausalityRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(sequence: ToolCallSequence): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let previousOutput: Record<string, unknown> | null = null;

    for (let i = 0; i < sequence.calls.length; i++) {
      const currentCall = sequence.calls[i];

      // 1. Check inherent schema/precondition (simplified for this advanced validator)
      if (!currentCall.toolName || Object.keys(currentCall.input).length === 0) {
        errors.push(`Call ${i} (${currentCall.toolName}): Missing tool name or input.`);
        continue;
      }

      // 2. Check advanced causality rules
      for (const rule of this.rules) {
        const result = rule.check(previousOutput, currentCall);
        if (!result.isValid) {
          errors.push(
            `Call ${i} (${currentCall.toolName}): Causality failed. ${result.reason}`
          );
        }
      }

      // 3. Update state for the next iteration (Simulate output generation)
      // In a real system, this would use the actual tool execution result.
      // Here, we simulate success based on the input context.
      previousOutput = {
        tool_call_id: currentCall.toolName + Math.random().toString(36).substring(2, 9),
        status: "completed",
        output_data: currentCall.input,
      };
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const createValidator = (): StructuredToolCallValidator => {
  const validator = new StructuredToolCallValidator();

  // Example default rule: Ensure the input for 'fetch_user_details' references a 'user_id'
  validator.addRule({
    check: (previousOutput, currentCall) => {
      if (currentCall.toolName === "fetch_user_details") {
        const userId = currentCall.input["user_id"];
        if (typeof userId !== "string" || !userId.match(/^\d+$/)) {
          return {
            isValid: false,
            reason: "The 'fetch_user_details' tool requires a valid numeric 'user_id' in its input.",
          };
        }
        return { isValid: true };
      }
      return { isValid: true };
    },
  });

  // Example default rule: Ensure the second call depends on the first call's output structure
  validator.addRule({
    check: (previousOutput, currentCall) => {
      if (currentCall.toolName === "process_data" && previousOutput) {
        const requiredKey = "processed_data_id";
        if (!(requiredKey in previousOutput.output_data)) {
          return {
            isValid: false,
            reason: `The 'process_data' tool requires the output from a preceding step to contain '${requiredKey}'.`,
          };
        }
      }
      return { isValid: true };
    },
  });

  return validator;
};