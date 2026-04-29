import {
  ToolInvocationRecord,
  ToolResult,
  ToolInvocationHistory,
} from "./tool-invocation-history";

export class ReplayContext {
  private history: ToolInvocationHistory;
  private currentState: Record<string, unknown>;

  constructor(history: ToolInvocationHistory, initialState: Record<string, unknown> = {}) {
    this.history = history;
    this.currentState = initialState;
  }

  public setInitialState(state: Record<string, unknown>): ReplayContext {
    this.currentState = state;
    return this;
  }

  public getCurrentState(): Record<string, unknown> {
    return { ...this.currentState };
  }

  public async replay(
    mockExecutor: (
      record: ToolInvocationRecord,
      context: Record<string, unknown>
    ) => Promise<ToolResult>
  ): Promise<{ finalState: Record<string, unknown>; results: ToolResult[] }> {
    let state = { ...this.currentState };
    const results: ToolResult[] = [];

    for (const record of this.history.records) {
      if (record.type === "tool_invocation") {
        const toolInvocationRecord = record as ToolInvocationRecord;
        try {
          const result = await mockExecutor(toolInvocationRecord, state);
          results.push(result);
          // In a real scenario, the mockExecutor would update the state based on the result.
          // For this simulation, we assume the mockExecutor handles state updates internally
          // or we rely on the caller to manage state updates if necessary.
          // For simplicity here, we just pass the state through.
          // A more complex implementation would require the mockExecutor to return the new state.
          // For now, we just update the state with the result's content if it's a success.
          if (!result.is_error) {
            state = { ...state, tool_output: result.content };
          }
        } catch (error) {
          // Handle execution failure during replay
          console.error("Replay failed for record:", record, error);
          break;
        }
      }
    }

    return { finalState: state, results };
  }

  public validateFinalState(expectedState: Record<string, unknown>): boolean {
    const currentState = this.getCurrentState();
    const isEqual = JSON.stringify(currentState) === JSON.stringify(expectedState);
    return isEqual;
  }
}