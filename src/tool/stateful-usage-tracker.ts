import { IStore } from "./store";

export interface ToolUsageState {
  toolName: string;
  totalCalls: number;
  totalCost: number;
  lastUsedTimestamp: number;
  currentState: Record<string, unknown>;
}

export class StatefulToolUsageTracker {
  private store: IStore;
  private toolName: string;
  private readonly stateKey: string;

  constructor(store: IStore, toolName: string) {
    this.store = store;
    this.toolName = toolName;
    this.stateKey = `usage_tracker:${toolName}`;
  }

  private async initializeState(): Promise<ToolUsageState> {
    const storedState = await this.store.get<ToolUsageState>(this.stateKey);
    if (storedState) {
      return storedState;
    }
    return {
      toolName: this.toolName,
      totalCalls: 0,
      totalCost: 0,
      lastUsedTimestamp: 0,
      currentState: {},
    };
  }

  public async recordUsage(cost: number, stateUpdate: Partial<Record<string, unknown>>): Promise<void> {
    let currentState = await this.getUsage(this.toolName);

    if (!currentState) {
      currentState = await this.initializeState();
    }

    const newTotalCalls = currentState.totalCalls + 1;
    const newTotalCost = currentState.totalCost + cost;
    const newLastUsedTimestamp = Date.now();
    const newCurrentState = { ...currentState.currentState, ...stateUpdate };

    const newState: ToolUsageState = {
      toolName: this.toolName,
      totalCalls: newTotalCalls,
      totalCost: newTotalCost,
      lastUsedTimestamp: newLastUsedTimestamp,
      currentState: newCurrentState,
    };

    await this.store.set(this.stateKey, newState);
  }

  public async getUsage(toolName: string): Promise<ToolUsageState | null> {
    if (toolName !== this.toolName) {
      return null;
    }
    return this.store.get<ToolUsageState>(this.stateKey);
  }

  public async getUsageSnapshot(): Promise<ToolUsageState> {
    let currentState = await this.getUsage(this.toolName);
    if (!currentState) {
      currentState = await this.initializeState();
    }
    return currentState;
  }
}