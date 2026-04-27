import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Snapshot {
  toolContext: Record<string, unknown>;
  localVariables: Map<string, unknown>;
  historySlice: Message[];
  timestamp: number;
}

export class SnapshotManager {
  private context: Record<string, unknown>;

  constructor(initialContext: Record<string, unknown>) {
    this.context = initialContext;
  }

  private serializeLocalVariables(variables: Map<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};
    variables.forEach((value, key) => {
      serialized[key] = value;
    });
    return serialized;
  }

  private deserializeLocalVariables(data: Record<string, unknown>): Map<string, unknown> {
    const map = new Map<string, unknown>();
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        map.set(key, data[key]);
      }
    }
    return map;
  }

  public createSnapshot(
    localVariables: Map<string, unknown>,
    historySlice: Message[]
  ): Snapshot {
    return {
      toolContext: this.context,
      localVariables: this.serializeLocalVariables(localVariables),
      historySlice: historySlice,
      timestamp: Date.now(),
    };
  }

  public restoreSnapshot(snapshot: Snapshot): {
    newLocalVariables: Map<string, unknown>;
    newContext: Record<string, unknown>;
  } {
    const newLocalVariables = this.deserializeLocalVariables(snapshot.localVariables);
    const newContext = { ...snapshot.toolContext };

    return {
      newLocalVariables: newLocalVariables,
      newContext: newContext,
    };
  }
}

export class ExecutionSnapshot {
  private manager: SnapshotManager;

  constructor(initialContext: Record<string, unknown>) {
    this.manager = new SnapshotManager(initialContext);
  }

  public capture(
    localVariables: Map<string, unknown>,
    historySlice: Message[]
  ): Snapshot {
    return this.manager.createSnapshot(localVariables, historySlice);
  }

  public restore(snapshot: Snapshot): {
    newLocalVariables: Map<string, unknown>;
    newContext: Record<string, unknown>;
  } {
    return this.manager.restoreSnapshot(snapshot);
  }
}