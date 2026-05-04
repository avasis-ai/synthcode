import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface AgentContext {
  // Placeholder for agent context data
}

export interface ToolCallHistory {
  // Placeholder for history of tool calls
}

export interface ToolCallRequest {
  tool_name: string;
  input: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ToolCallGuardrail {
  validate(
    context: AgentContext,
    history: ToolCallHistory,
    nextCall: ToolCallRequest
  ): ValidationResult;
}

export class ContextualToolCallGuardrailChain {
  private guardrails: ToolCallGuardrail[];

  constructor(guardrails: ToolCallGuardrail[]) {
    this.guardrails = guardrails;
  }

  public validate(
    context: AgentContext,
    history: ToolCallHistory,
    nextCall: ToolCallRequest
  ): ValidationResult {
    let allErrors: string[] = [];
    let firstFailure = false;

    for (const guardrail of this.guardrails) {
      const result = guardrail.validate(context, history, nextCall);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        if (!firstFailure) {
          firstFailure = true;
        }
      }
    }

    const isValid = allErrors.length === 0;

    return {
      isValid: isValid,
      errors: allErrors,
    };
  }
}