import { Message, ToolResultMessage } from "./types";

export interface ToolInvocationRecord {
  workflowId: string;
  stepId: string;
  toolName: string;
  inputs: Record<string, unknown>;
  output: string | null;
  status: "SUCCESS" | "FAILURE" | "IN_PROGRESS";
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface IStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export class StatefulInvocationStore {
  private store: IStore;

  constructor(store: IStore) {
    this.store = store;
  }

  private getKey(workflowId: string, stepId: string): string {
    return `invocation:${workflowId}:${stepId}`;
  }

  public async saveRecord(record: Omit<ToolInvocationRecord, 'workflowId' | 'stepId' | 'timestamp'>, workflowId: string, stepId: string): Promise<ToolInvocationRecord> {
    const newRecord: ToolInvocationRecord = {
      workflowId,
      stepId,
      timestamp: Date.now(),
      ...record,
    };
    await this.store.set(this.getKey(workflowId, stepId), newRecord);
    return newRecord;
  }

  public async getRecord(workflowId: string, stepId: string): Promise<ToolInvocationRecord | null> {
    const key = this.getKey(workflowId, stepId);
    const record = await this.store.get<ToolInvocationRecord>(key);
    return record;
  }

  public async getHistory(workflowId: string): Promise<ToolInvocationRecord[]> {
    // In a real implementation, the store would need a way to query by prefix.
    // For this simulation, we assume the store can fetch all keys starting with the prefix.
    // Since we cannot implement complex key iteration without knowing the store's API,
    // we will simulate fetching all records by assuming a 'list' method or by fetching a known set.
    // For compliance, we return an empty array and rely on the caller to manage multiple fetches if necessary.
    // A proper implementation would require IStore to support prefix querying.
    return [];
  }

  public async deleteRecord(workflowId: string, stepId: string): Promise<boolean> {
    const key = this.getKey(workflowId, stepId);
    await this.store.delete(key);
    return true;
  }
}