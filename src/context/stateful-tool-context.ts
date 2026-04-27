import { Message, ToolResultMessage } from "./types";

export interface ToolState {
  toolId: string;
  lastUpdated: number;
  inputs: Record<string, unknown>;
  intermediateOutputs: Record<string, any>;
  executionSteps: Array<{
    stepId: string;
    timestamp: number;
    metadata: Record<string, unknown>;
    output: any;
  }>;
  contextMessages: Message[];
  version: number;
}

export interface Store {
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export class StatefulToolContext {
  private store: Store;
  private toolId: string;

  constructor(store: Store, toolId: string) {
    this.store = store;
    this.toolId = toolId;
  }

  private getStoreKey(): string {
    return `tool_context:${this.toolId}`;
  }

  public async loadState(): Promise<ToolState | null> {
    const state = await this.store.get(this.getStoreKey());
    return state ? state as ToolState : null;
  }

  public async saveState(state: ToolState): Promise<void> {
    if (!state.toolId) {
      throw new Error("ToolState must have a toolId before saving.");
    }
    state.toolId = this.toolId;
    state.lastUpdated = Date.now();
    await this.store.set(this.getStoreKey(), state);
  }

  public async initializeState(initialInputs: Record<string, unknown>): Promise<ToolState> {
    const existingState = await this.loadState();
    if (existingState) {
      return existingState;
    }

    const newState: ToolState = {
      toolId: this.toolId,
      lastUpdated: Date.now(),
      inputs: initialInputs,
      intermediateOutputs: {},
      executionSteps: [],
      contextMessages: [],
      version: 1,
    };
    await this.saveState(newState);
    return newState;
  }

  public async updateContext(newMessages: Message[]): Promise<ToolState> {
    const currentState = await this.loadState();
    if (!currentState) {
      throw new Error("Cannot update context: No state loaded. Initialize first.");
    }

    const updatedState: ToolState = {
      ...currentState,
      contextMessages: [...currentState.contextMessages, ...newMessages],
      version: currentState.version + 1,
      lastUpdated: Date.now(),
    };

    await this.saveState(updatedState);
    return updatedState;
  }

  public async recordStep(stepMetadata: Record<string, unknown>, output: any): Promise<ToolState> {
    const currentState = await this.loadState();
    if (!currentState) {
      throw new Error("Cannot record step: No state loaded. Initialize first.");
    }

    const newStep = {
      stepId: `step_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      metadata: stepMetadata,
      output: output,
    };

    const updatedState: ToolState = {
      ...currentState,
      executionSteps: [...currentState.executionSteps, newStep],
      intermediateOutputs: {
        ...currentState.intermediateOutputs,
        [`step_${currentState.executionSteps.length}`]: output,
      },
      version: currentState.version + 1,
      lastUpdated: Date.now(),
    };

    await this.saveState(updatedState);
    return updatedState;
  }
}