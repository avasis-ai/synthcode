import { EventEmitter } from "events";

export interface ToolInteractionRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  executionMetadata: {
    durationMs: number;
    success: boolean;
  };
  contextId: string;
}

export interface IStore {
  saveRecord(contextId: string, record: ToolInteractionRecord): Promise<void>;
  getRecordsForContext(contextId: string): Promise<ToolInteractionRecord[]>;
}

export class StatefulHistoryStore {
  private store: IStore;

  constructor(store: IStore) {
    this.store = store;
  }

  async recordInteraction(contextId: string, record: ToolInteractionRecord): Promise<void> {
    return this.store.saveRecord(contextId, record);
  }

  async getHistoryForContext(contextId: string): Promise<ToolInteractionRecord[]> {
    return this.store.getRecordsForContext(contextId);
  }
}

export class InMemoryStore implements IStore {
  private storage: Map<string, ToolInteractionRecord[]> = new Map();

  async saveRecord(contextId: string, record: ToolInteractionRecord): Promise<void> {
    const history = this.storage.get(contextId) || [];
    this.storage.set(contextId, [...history, record]);
  }

  async getRecordsForContext(contextId: string): Promise<ToolInteractionRecord[]> {
    return this.storage.get(contextId) ? [...this.storage.get(contextId)] : [];
  }
}

export const createDefaultStore = (): StatefulHistoryStore => {
  const inMemoryStore = new InMemoryStore();
  return new StatefulHistoryStore(inMemoryStore);
};