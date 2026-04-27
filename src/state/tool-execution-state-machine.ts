import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export enum ToolExecutionState {
  INITIALIZING = "INITIALIZING",
  PENDING = "PENDING",
  EXECUTING = "EXECUTING",
  WAITING_FOR_EXTERNAL_INPUT = "WAITING_FOR_EXTERNAL_INPUT",
  VALIDATING = "VALIDATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type ToolExecutionContext = {
  message: Message;
  toolId: string;
  attemptCount: number;
};

export class ToolExecutionStateMachine {
  private currentState: ToolExecutionState;

  private readonly validTransitions: Record<
    ToolExecutionState,
    Set<ToolExecutionState>
  > = {
    [ToolExecutionState.INITIALIZING]: new Set([
      ToolExecutionState.PENDING,
      ToolExecutionState.FAILED,
    ]),
    [ToolExecutionState.PENDING]: new Set([
      ToolExecutionState.EXECUTING,
      ToolExecutionState.FAILED,
    ]),
    [ToolExecutionState.EXECUTING]: new Set([
      ToolExecutionState.WAITING_FOR_EXTERNAL_INPUT,
      ToolExecutionState.VALIDATING,
      ToolExecutionState.COMPLETED,
      ToolExecutionState.FAILED,
    ]),
    [ToolExecutionState.WAITING_FOR_EXTERNAL_INPUT]: new Set([
      ToolExecutionState.EXECUTING,
      ToolExecutionState.FAILED,
    ]),
    [ToolExecutionState.VALIDATING]: new Set([
      ToolExecutionState.COMPLETED,
      ToolExecutionState.FAILED,
    ]),
    [ToolExecutionState.COMPLETED]: new Set([
      // Terminal state, no outgoing transitions allowed
    ]),
    [ToolExecutionState.FAILED]: new Set([
      // Terminal state, no outgoing transitions allowed
    ]),
  };

  constructor(initialState: ToolExecutionState = ToolExecutionState.INITIALIZING) {
    this.currentState = initialState;
  }

  public getCurrentState(): ToolExecutionState {
    return this.currentState;
  }

  public transition(
    nextState: ToolExecutionState,
    context: ToolExecutionContext
  ): { success: boolean; newState: ToolExecutionState; message: string } {
    if (!this.isValidTransition(nextState)) {
      return {
        success: false,
        newState: this.currentState,
        message: `Invalid transition from ${this.currentState} to ${nextState}.`,
      };
    }

    this.currentState = nextState;
    return {
      success: true,
      newState: this.currentState,
      message: `Transitioned successfully from ${this.currentState} to ${nextState}.`,
    };
  }

  private isValidTransition(nextState: ToolExecutionState): boolean {
    const allowedStates = this.validTransitions[this.currentState];
    if (!allowedStates) {
      return false;
    }
    return allowedStates.has(nextState);
  }

  public reset(initialState: ToolExecutionState = ToolExecutionState.INITIALIZING): void {
    this.currentState = initialState;
  }
}