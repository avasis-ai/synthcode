import { EventEmitter } from "events";

export enum ExecutionState {
  PENDING_INPUT = "PENDING_INPUT",
  EXECUTING = "EXECUTING",
  AWAITING_OUTPUT = "AWAITING_OUTPUT",
  VALIDATING = "VALIDATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface ToolExecutionState {
  executionId: string;
  currentState: ExecutionState;
  startTime: Date;
  lastUpdated: Date;
  context: Record<string, unknown>;
  history: {
    timestamp: Date;
    state: ExecutionState;
    context: Record<string, unknown>;
    event?: { name: string; payload: unknown };
  }[];
}

export interface StateUpdatePayload {
  newState: ExecutionState;
  contextData?: Record<string, unknown>;
  event?: { name: string; payload: unknown };
}

export class ToolExecutionStateTracker extends EventEmitter {
  private state: ToolExecutionState;

  constructor(executionId: string) {
    super();
    this.state = {
      executionId: executionId,
      currentState: ExecutionState.PENDING_INPUT,
      startTime: new Date(),
      lastUpdated: new Date(),
      context: {},
      history: [{
        timestamp: new Date(),
        state: ExecutionState.PENDING_INPUT,
        context: {},
      }],
    };
  }

  public getState(): ToolExecutionState {
    return { ...this.state };
  }

  private recordTransition(newState: ExecutionState, contextData?: Record<string, unknown>, event?: { name: string; payload: unknown }): void {
    const now = new Date();
    this.state.history.push({
      timestamp: now,
      state: newState,
      context: { ...this.state.context, ...(contextData || {}) },
      event: event,
    });
    this.state.currentState = newState;
    this.state.lastUpdated = now;
    this.emit("stateChange", {
      newState: newState,
      state: this.getState(),
    });
  }

  public setState(newState: ExecutionState, contextData?: Record<string, unknown>): void {
    this.recordTransition(newState, contextData);
  }

  public recordEvent(eventName: string, payload: unknown): void {
    this.recordTransition(
      this.state.currentState,
      undefined,
      { name: eventName, payload: payload },
    );
  }

  public updateContext(key: string, value: unknown): void {
    this.state.context[key] = value;
    this.emit("contextUpdate", {
      key: key,
      value: value,
      state: this.getState(),
    });
  }
}