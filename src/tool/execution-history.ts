import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, LoopEvent } from "./types";

export interface ToolExecutionRecord {
  sessionId: string;
  toolName: string;
  toolUseId: string;
  input: Record<string, unknown>;
  output: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface HistoryStore {
  saveRecord(record: ToolExecutionRecord): Promise<void>;
  getRecordsBySession(sessionId: string): Promise<ToolExecutionRecord[]>;
  getRecordCount(sessionId: string): Promise<number>;
}

export class ExecutionHistoryStore implements HistoryStore {
  private storage: Map<string, ToolExecutionRecord[]>;

  constructor() {
    this.storage = new Map();
  }

  private async simulatePersistence(sessionId: string, record: ToolExecutionRecord): Promise<void> {
    // In a real implementation, this would interact with SQLite or Memorystore
    if (!this.storage.has(sessionId)) {
      this.storage.set(sessionId, []);
    }
    const records = this.storage.get(sessionId)!;
    records.push(record);
    console.log(`[HistoryStore] Saved record for session ${sessionId}: ${record.toolName}`);
  }

  async saveRecord(record: ToolExecutionRecord): Promise<void> {
    await this.simulatePersistence(record.sessionId, record);
  }

  async getRecordsBySession(sessionId: string): Promise<ToolExecutionRecord[]> {
    // Simulate fetching from persistent storage
    return this.storage.get(sessionId) || [];
  }

  async getRecordCount(sessionId: string): Promise<number> {
    return this.storage.get(sessionId)?.length || 0;
  }
}

export class Agent {
  private historyStore: HistoryStore;

  constructor(historyStore: HistoryStore) {
    this.historyStore = historyStore;
  }

  public async processToolCall(
    sessionId: string,
    toolName: string,
    toolUseId: string,
    input: Record<string, unknown>,
    output: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const record: ToolExecutionRecord = {
      sessionId: sessionId,
      toolName: toolName,
      toolUseId: toolUseId,
      input: input,
      output: output,
      timestamp: Date.now(),
      metadata: metadata,
    };

    await this.historyStore.saveRecord(record);
  }
}