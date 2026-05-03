import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type State = string;

export interface Precondition {
  key: string;
  check: (context: Record<string, unknown>, message: Message) => boolean;
}

export interface StateTransitionRule {
  fromState: State;
  toState: State;
  requiredPreconditions: Precondition[];
}

export interface ValidatorContext {
  currentState: State;
  targetState: State;
  context: Record<string, unknown>;
  lastMessage: Message;
}

export class ContextualStateTransitionValidator {
  private rules: StateTransitionRule[];

  constructor(rules: StateTransitionRule[]) {
    this.rules = rules;
  }

  validate(context: ValidatorContext): { isValid: boolean; error?: string } {
    for (const rule of this.rules) {
      if (rule.fromState === context.currentState && rule.toState === context.targetState) {
        if (this.checkPreconditions(rule.requiredPreconditions, context)) {
          return { isValid: true };
        } else {
          return {
            isValid: false,
            error: `Transition from ${context.currentState} to ${context.targetState} failed precondition checks.`,
          };
        }
      }
    }

    return {
      isValid: false,
      error: `No valid transition rule found from ${context.currentState} to ${context.targetState}.`,
    };
  }

  private checkPreconditions(preconditions: Precondition[], context: ValidatorContext): boolean {
    for (const precondition of preconditions) {
      if (!precondition.check(context.context, context.lastMessage)) {
        return false;
      }
    }
    return true;
  }
}