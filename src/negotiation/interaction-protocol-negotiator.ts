import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ProtocolState = string;

interface TransitionRule {
  allowedMessageTypes: Array<keyof Message>;
  validate: (message: Message, currentState: ProtocolState) => { isValid: boolean; reason?: string };
  nextState: ProtocolState;
}

interface ProtocolContract {
  initialState: ProtocolState;
  states: Record<ProtocolState, Record<string, TransitionRule>>;
}

export class InteractionProtocolNegotiator {
  private contract: ProtocolContract;
  private currentState: ProtocolState;

  constructor(contract: ProtocolContract) {
    this.contract = contract;
    this.currentState = contract.initialState;
  }

  public getCurrentState(): ProtocolState {
    return this.currentState;
  }

  public initiateNegotiation(): ProtocolState {
    return this.contract.initialState;
  }

  public validateMessage(message: Message): { isValid: boolean; newState: ProtocolState; reason?: string } {
    const stateTransitions = this.contract.states[this.currentState];

    if (!stateTransitions) {
      return { isValid: false, newState: this.currentState, reason: `No transitions defined for state: ${this.currentState}` };
    }

    const messageTypeKey = typeof message;
    const transitionKey = Object.keys(stateTransitions).find(key => {
      const rule = stateTransitions[key];
      return (rule as any).allowedMessageTypes.includes(messageTypeKey as any);
    });

    if (!transitionKey) {
      return { isValid: false, newState: this.currentState, reason: `Message type ${messageTypeKey} is not allowed in state ${this.currentState}.` };
    }

    const transition = stateTransitions[transitionKey];
    const validationResult = transition.validate(message, this.currentState);

    if (!validationResult.isValid) {
      return { isValid: false, newState: this.currentState, reason: `Validation failed: ${validationResult.reason}` };
    }

    this.currentState = transition.nextState;
    return { isValid: true, newState: this.currentState };
  }

  public resolveConflict(message: Message, conflictReason: string): { isValid: boolean; newState: ProtocolState } {
    console.warn(`Protocol Conflict Detected: ${conflictReason}. Attempting forced state resolution.`);
    // In a real system, this would involve complex rollback or escalation logic.
    // For simulation, we assume conflict resolution forces a known recovery state.
    const recoveryState = "CONFLICT_RESOLVED";
    this.currentState = recoveryState;
    return { isValid: true, newState: recoveryState };
  }
}