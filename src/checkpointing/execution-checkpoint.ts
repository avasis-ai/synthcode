import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface CheckpointState {
  messages: Message[];
  context: Record<string, unknown>;
  currentStep: number;
  history: {
    step: number;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  }[];
  lastToolCallId: string | null;
}

export interface IStore {
  save: (key: string, data: any) => Promise<void>;
  load: (key: string) => Promise<any | null>;
}

export class CheckpointManager {
  private readonly store: IStore;

  constructor(store: IStore) {
    this.store = store;
  }

  async save(state: CheckpointState, checkpointKey: string): Promise<void> {
    console.log(`Saving checkpoint to key: ${checkpointKey}`);
    await this.store.save(checkpointKey, state);
  }

  async load(checkpointKey: string): Promise<CheckpointState | null> {
    console.log(`Attempting to load checkpoint from key: ${checkpointKey}`);
    const rawState = await this.store.load(checkpointKey);
    if (!rawState) {
      return null;
    }
    return rawState as CheckpointState;
  }
}