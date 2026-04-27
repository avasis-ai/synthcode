import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export interface ToolInvocationState {
  toolId: string;
  intent: string;
  requiredInputs: Record<string, { schema: any; defaultValue?: unknown }>;
  lastSuccessfulOutput: unknown | null;
  lastExecutedAt: Date;
}

export class ToolInvocationTracker {
  private contexts: Map<string, ToolInvocationState>;

  constructor() {
    this.contexts = new Map<string, ToolInvocationState>();
  }

  recordIntent(toolId: string, goal: string, requiredInputs: Record<string, { schema: any; defaultValue?: unknown }>): void {
    if (this.contexts.has(toolId)) {
      this.contexts.get(toolId)! = {
        toolId: toolId,
        intent: goal,
        requiredInputs: requiredInputs,
        lastSuccessfulOutput: null,
        lastExecutedAt: new Date(),
      };
    } else {
      const newState: ToolInvocationState = {
        toolId: toolId,
        intent: goal,
        requiredInputs: requiredInputs,
        lastSuccessfulOutput: null,
        lastExecutedAt: new Date(),
      };
      this.contexts.set(toolId, newState);
    }
  }

  updateState(toolId: string, newState: unknown, result: unknown): void {
    const currentState = this.contexts.get(toolId);
    if (!currentState) {
      throw new Error(`Tool context not found for ID: ${toolId}`);
    }

    const updatedState: ToolInvocationState = {
      ...currentState,
      lastSuccessfulOutput: result,
      lastExecutedAt: new Date(),
    };

    this.contexts.set(toolId, updatedState);
  }

  getState(toolId: string): ToolInvocationState | undefined {
    return this.contexts.get(toolId);
  }

  getAllToolStates(): Map<string, ToolInvocationState> {
    return new Map(this.contexts);
  }
}