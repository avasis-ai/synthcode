export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type AgentState =
  | "IDLE"
  | "PLANNING"
  | "EXECUTING"
  | "REFLECTING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

export type TransitionGuard = (currentState: AgentState, event: LoopEvent) => boolean;

export type StateHooks = {
  onEnter: (state: AgentState) => void;
  onExit: (state: AgentState) => void;
};

export class AgentLifecycleStateManager {
  private currentState: AgentState;
  private hooks: Record<AgentState, StateHooks>;

  constructor(initialState: AgentState = "IDLE") {
    this.currentState = initialState;
    this.hooks = {} as Record<AgentState, StateHooks>;
  }

  public getCurrentState(): AgentState {
    return this.currentState;
  }

  public setHooks(hooks: Record<AgentState, StateHooks>): void {
    this.hooks = hooks;
  }

  private isValidTransition(fromState: AgentState, event: LoopEvent): boolean {
    switch (fromState) {
      case "IDLE":
        return (event as any).type === "text";
      case "PLANNING":
        return (event as any).type === "thinking" || (event as any).type === "text";
      case "EXECUTING":
        return (event as any).type === "tool_result";
      case "REFLECTING":
        return (event as any).type === "thinking";
      case "PAUSED":
        return (event as any).type === "text";
      case "COMPLETED":
        return false;
      case "FAILED":
        return false;
      default:
        return false;
    }
  }

  public transition(event: LoopEvent): boolean {
    const oldState = this.currentState;

    if (!this.isValidTransition(oldState, event)) {
      console.warn(`[State Manager] Invalid transition attempted from ${oldState} with event type ${typeof event === 'object' && event !== null ? Object.keys(event).join(', ') : 'unknown'}.`);
      return false;
    }

    const newState: AgentState = this.determineNextState(oldState, event);

    if (newState === oldState) {
      console.warn(`[State Manager] Transition from ${oldState} to ${newState} is redundant or not defined.`);
      return false;
    }

    console.log(`[State Manager] Transitioning: ${oldState} -> ${newState}`);

    if (this.hooks[oldState] && this.hooks[oldState].onExit) {
      this.hooks[oldState].onExit(oldState);
    }

    this.currentState = newState;

    if (this.hooks[newState] && this.hooks[newState].onEnter) {
      this.hooks[newState].onEnter(newState);
    }

    return true;
  }

  private determineNextState(currentState: AgentState, event: LoopEvent): AgentState {
    switch (currentState) {
      case "IDLE":
        if ((event as any).type === "text") return "PLANNING";
        break;
      case "PLANNING":
        if ((event as any).type === "thinking") return "EXECUTING";
        if ((event as any).type === "text") return "PAUSED";
        break;
      case "EXECUTING":
        if ((event as any).type === "tool_result") {
          if ((event as any).content && (event as any).content.includes("error")) {
            return "FAILED";
          }
          return "REFLECTING";
        }
        break;
      case "REFLECTING":
        if ((event as any).type === "thinking") return "COMPLETED";
        break;
      case "PAUSED":
        if ((event as any).type === "text") return "PLANNING";
        break;
      default:
        return currentState;
    }
    return currentState;
  }
}

export { AgentLifecycleStateManager };