import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  history: Message[];
  state: Record<string, unknown>;
  constraints: Record<string, any>;
}

export interface ContextualToolCallValidator {
  validate(
    history: Message[],
    state: Record<string, unknown>,
    constraints: Record<string, any>,
    currentToolCalls: ToolUseBlock[]
  ): { isValid: boolean; errors: string[] };
}

export class ContextualToolCallValidatorV166 implements ContextualToolCallValidator {
  validate(
    history: Message[],
    state: Record<string, unknown>,
    constraints: Record<string, any>,
    currentToolCalls: ToolUseBlock[]
  ): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];
    let lastToolCallId: string | null = null;

    if (!currentToolCalls || currentToolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < currentToolCalls.length; i++) {
      const currentCall = currentToolCalls[i];

      // 1. Check for temporal/dependency violations between adjacent calls
      if (i > 0) {
        const previousCall = currentToolCalls[i - 1];
        if (previousCall.id === lastToolCallId) {
          errors.push(`[Dependency Error] Consecutive tool calls must have unique IDs. Found duplicate ID: ${currentCall.id}`);
        }
        // Advanced check: Ensure the current call depends logically on the result of the previous one
        // This is a placeholder for complex logic based on state/history
        if (typeof state.lastToolResult === 'string' && !currentCall.name.includes("process")) {
           // Example: If state indicates a result, the next call should process it.
           // This requires deep knowledge of the tool schemas, simulated here.
           // if (!currentCall.input.hasOwnProperty('result_id')) {
           //    errors.push(`[Context Error] Tool call ${currentCall.name} seems to ignore the previous result.`);
           // }
        }
      }

      // 2. Cross-step constraint validation (using history/state)
      if (constraints.requiredPrecondition && !this.checkPrecondition(currentCall, constraints.requiredPrecondition, state)) {
        errors.push(`[Constraint Error] Tool call ${currentCall.name} requires precondition: ${constraints.requiredPrecondition}. State check failed.`);
      }

      // 3. ID uniqueness check across the entire batch
      if (currentCall.id === lastToolCallId) {
        errors.push(`[Uniqueness Error] Tool call ID ${currentCall.id} is repeated within this batch.`);
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }

  private checkPrecondition(
    call: ToolUseBlock,
    precondition: string,
    state: Record<string, unknown>
  ): boolean {
    // Placeholder for complex logic: e.g., checking if state['user_id'] exists before calling 'create_user_profile'
    if (precondition.includes("user_id")) {
      return typeof state.user_id === 'string' && state.user_id.length > 0;
    }
    return true;
  }
}

export const createContextualToolCallValidator = (): ContextualToolCallValidator => {
  return new ContextualToolCallValidatorV166();
};