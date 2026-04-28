import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface ToolState {
  toolName: string;
  lastArguments: Record<string, unknown>;
  executionHistory: string[];
}

export interface AgentContext {
  sessionId: string;
  currentStep: number;
  activeConstraints: string[];
  lastToolCallId: string | null;
}

export interface StatePayload {
  messages: Message[];
  context: AgentContext;
  toolStates: Record<string, ToolState>;
  internalCounters: Record<string, number>;
  timestamp: number;
}

export class CheckpointManager {
  private storage: Map<string, StatePayload> = new Map();

  private generateSnapshotId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }

  saveState(payload: StatePayload): Promise<string> {
    return new Promise((resolve) => {
      const snapshotId = this.generateSnapshotId();
      this.storage.set(snapshotId, {
        messages: [...payload.messages],
        context: { ...payload.context },
        toolStates: { ...payload.toolStates },
        internalCounters: { ...payload.internalCounters },
        timestamp: Date.now(),
      });
      resolve(snapshotId);
    });
  }

  restoreState(snapshotId: string): Promise<StatePayload> {
    return new Promise((resolve, reject) => {
      const payload = this.storage.get(snapshotId);
      if (!payload) {
        reject(new Error(`Checkpoint with ID ${snapshotId} not found.`));
        return;
      }
      // Return a deep copy to ensure immutability upon restoration
      const restoredPayload: StatePayload = {
        messages: [...payload.messages],
        context: { ...payload.context },
        toolStates: { ...payload.toolStates },
        internalCounters: { ...payload.internalCounters },
        timestamp: payload.timestamp,
      };
      resolve(restoredPayload);
    });
  }

  getAvailableSnapshots(): string[] {
    return Array.from(this.storage.keys());
  }
}

export { CheckpointManager };