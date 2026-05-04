import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type StateMachineDefinition = {
  initialState: string;
  transitions: Record<string, Record<string, {
    nextState: string;
    guard?: (history: Message[], currentState: string, event: Message) => boolean;
    action?: (history: Message[], currentState: string, event: Message) => { nextState: string; payload: any };
  }>>;
};

export interface ValidatorContext {
  currentState: string;
  history: Message[];
}

export class ContextualEventSourcingValidator {
  private readonly stateMachine: StateMachineDefinition;

  constructor(stateMachine: StateMachineDefinition) {
    this.stateMachine = stateMachine;
  }

  public validate(
    context: ValidatorContext,
    event: Message
  ): { isValid: boolean; reason?: string; nextState?: string; payload?: any } {
    const { currentState, history } = context;

    if (!this.stateMachine.transitions[currentState]) {
      return { isValid: false, reason: `No transitions defined for current state: ${currentState}` };
    }

    const stateTransitions = this.stateMachine.transitions[currentState];

    if (!stateTransitions[this.getEventTypeName(event)]) {
      return { isValid: false, reason: `Invalid event type '${this.getEventTypeName(event)}' for current state: ${currentState}` };
    }

    const transition = stateTransitions[this.getEventTypeName(event)];

    if (transition.guard && !transition.guard(history, currentState, event)) {
      return { isValid: false, reason: `Transition guard failed for event ${this.getEventTypeName(event)} in state ${currentState}` };
    }

    if (transition.action) {
      try {
        const result = transition.action(history, currentState, event);
        return {
          isValid: true,
          nextState: result.nextState,
          payload: result.payload,
        };
      } catch (e) {
        return { isValid: false, reason: `Action execution failed: ${(e as Error).message}` };
      }
    } else {
      return {
        isValid: true,
        nextState: transition.nextState,
      };
    }
  }

  private getEventTypeName(event: Message): string {
    if ('role' in event) {
      const message = event as { role: string; content: any };
      return message.role;
    }
    // Fallback for other message types if they were defined differently
    return 'unknown';
  }
}