import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface SuspensionContext {
  history: Message[];
  globalContext: Record<string, unknown>;
  currentStepIndex: number;
  remainingSteps: Array<{
  type: string;
  data: Record<string, unknown>;
}>;
}

export interface SuspensionState {
  suspensionId: string;
  context: SuspensionContext;
  suspensionReason: string;
  timestamp: number;
}

export class SuspensionManager {
  private storage: Map<string, SuspensionState> = new Map();

  suspend(context: SuspensionContext, reason: string): string {
    const suspensionId = `susp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const state: SuspensionState = {
      suspensionId,
      context,
      suspensionReason: reason,
      timestamp: Date.now(),
    };

    this.storage.set(suspensionId, state);
    return suspensionId;
  }

  getSuspensionState(suspensionId: string): SuspensionState | undefined {
    return this.storage.get(suspensionId);
  }

  resume(suspensionId: string, externalPayload: Record<string, unknown>): SuspensionContext | null {
    const state = this.storage.get(suspensionId);

    if (!state) {
      return null;
    }

    // 1. Update global context with external payload
    const updatedContext: SuspensionContext = {
      ...state.context,
      globalContext: {
        ...state.context.globalContext,
        ...externalPayload,
      },
    };

    // 2. Simulate state progression/cleanup if necessary
    // For simplicity, we just return the updated context, assuming the caller handles step execution.

    // 3. Optionally, remove the state after successful resumption if it's a one-time recovery
    // this.storage.delete(suspensionId);

    return updatedContext;
  }

  getSuspensionHistory(): Map<string, SuspensionState> {
    return this.storage;
  }
}