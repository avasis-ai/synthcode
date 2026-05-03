import { Message, ToolUseBlock } from "./types";

export type ToolInvocationState = {
  lastToolCallId: string;
  lastToolName: string;
  invocationCount: number;
  lastInvocationTime: number;
};

export type TransitionRule = {
  fromState: string;
  toState: string;
  isValid: (currentState: ToolInvocationState, nextToolName: string, nextInput: Record<string, unknown>): boolean;
};

export type GuardrailRuleSet = {
  rules: TransitionRule[];
  initialState: string;
  maxAgeMs: number;
};

export class StatefulToolInvocationGuardrail {
  private history: Map<string, ToolInvocationState>;
  private ruleset: GuardrailRuleSet;

  constructor(ruleset: GuardrailRuleSet) {
    this.ruleset = ruleset;
    this.history = new Map<string, ToolInvocationState>();
  }

  private getToolIdFromMessage(message: Message): string | null {
    if (message.role === "tool") {
      const resultMessage = message as any;
      return resultMessage.tool_use_id;
    }
    return null;
  }

  private getCurrentState(toolId: string): ToolInvocationState {
    const now = Date.now();
    const currentState = this.history.get(toolId);

    if (!currentState) {
      return {
        lastToolCallId: "",
        lastToolName: "",
        invocationCount: 0,
        lastInvocationTime: 0,
      };
    }

    if (now - currentState.lastInvocationTime > this.ruleset.maxAgeMs) {
      return {
        lastToolCallId: "",
        lastToolName: "",
        invocationCount: 0,
        lastInvocationTime: 0,
      };
    }
    return currentState;
  }

  private checkTransition(
    toolId: string,
    toolName: string,
    input: Record<string, unknown>
  ): boolean {
    const currentState = this.getCurrentState(toolId);

    const currentStateKey = this.determineStateKey(currentState);
    const nextStateKey = this.determineStateKey(toolName, input);

    const validTransition = this.ruleset.rules.some(rule =>
      rule.fromState === currentStateKey &&
      rule.toState === nextStateKey &&
      rule.isValid(currentState, toolName, input)
    );

    return validTransition;
  }

  private determineStateKey(state: ToolInvocationState): string {
    if (state.lastToolName) {
      return `LAST_${state.lastToolName}`;
    }
    return "INITIAL";
  }

  private determineStateKey(toolName: string, input: Record<string, unknown>): string {
    if (toolName.includes("create")) {
      return "CREATED";
    }
    if (toolName.includes("read")) {
      return "READ";
    }
    return "UNKNOWN";
  }

  public guard(
    toolId: string,
    toolName: string,
    input: Record<string, unknown>
  ): { isValid: boolean; newState: ToolInvocationState } {
    const currentState = this.getCurrentState(toolId);

    if (!this.checkTransition(toolId, toolName, input)) {
      return { isValid: false, newState: currentState };
    }

    const newState: ToolInvocationState = {
      lastToolCallId: toolId,
      lastToolName: toolName,
      invocationCount: currentState.invocationCount + 1,
      lastInvocationTime: Date.now(),
    };

    this.history.set(toolId, newState);
    return { isValid: true, newState };
  }

  public reset(toolId: string): void {
    this.history.delete(toolId);
  }
}