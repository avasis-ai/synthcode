import { Message, ToolResultMessage } from "./types";

export interface InvocationRecord {
  timestamp: number;
  contextId: string;
  toolName: string;
  input: Record<string, unknown>;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
}

export interface IStore {
  saveRecord(record: InvocationRecord): Promise<void>;
  getRecordsByContext(contextId: string): Promise<InvocationRecord[]>;
  getRecordsSince(sinceTimestamp: number): Promise<InvocationRecord[]>;
  getAllRecords(): Promise<InvocationRecord[]>;
}

export class StatefulToolInvocationHistoryManager {
  private store: IStore;

  constructor(store: IStore) {
    this.store = store;
  }

  async recordInvocation(
    contextId: string,
    toolName: string,
    input: Record<string, unknown>,
    success: boolean,
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    const record: InvocationRecord = {
      timestamp: Date.now(),
      contextId: contextId,
      toolName: toolName,
      input: input,
      success: success,
      durationMs: durationMs,
      errorMessage: errorMessage,
    };
    await this.store.saveRecord(record);
  }

  async getContextHistory(contextId: string): Promise<InvocationRecord[]> {
    return this.store.getRecordsByContext(contextId);
  }

  async getRecentHistory(hoursAgo: number): Promise<InvocationRecord[]> {
    const sinceTimestamp = Date.now() - hoursAgo * 60 * 60 * 1000;
    return this.store.getRecordsSince(sinceTimestamp);
  }

  async getToolStatistics(toolName: string, contextId: string): Promise<{ total: number; success: number; failure: number; successRate: number }> {
    const records = await this.store.getRecordsByContext(contextId);
    const relevantRecords = records.filter(record => record.toolName === toolName);
    const total = relevantRecords.length;
    const success = relevantRecords.filter(r => r.success).length;
    const failure = total - success;
    return {
      total,
      success,
      failure,
      successRate: total > 0 ? success / total : 0,
    };
  }

  async getMostFrequentFailingTool(contextId: string, limit: number = 3): Promise<{ toolName: string; count: number }[]> {
    const records = await this.store.getRecordsByContext(contextId);
    const failingRecords = records.filter(record => !record.success);

    const toolCounts = new Map<string, number>();
    for (const record of failingRecords) {
      toolCounts.set(record.toolName, (toolCounts.get(record.toolName) || 0) + 1);
    }

    const sortedTools = Array.from(toolCounts.entries()).map(([toolName, count]) => ({ toolName, count }));

    return sortedTools.sort((a, b) => b.count - a.count).slice(0, limit);
  }
}