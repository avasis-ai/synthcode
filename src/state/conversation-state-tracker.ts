import {
  Message,
  ContentBlock,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolContext {
  [key: string]: any;
}

export interface Checkpoint {
  checkpointId: string;
  timestamp: number;
  messages: Message[];
  toolContext: ToolContext;
  // Add other state elements here if needed, e.g., agent_scratchpad: string
}

export class ConversationStateTracker {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private currentState: {
    messages: Message[];
    toolContext: ToolContext;
  } = {
    messages: [],
    toolContext: {},
  };

  constructor(initialMessages: Message[] = [], initialContext: ToolContext = {}) {
    this.currentState.messages = initialMessages;
    this.currentState.toolContext = initialContext;
  }

  private generateCheckpointId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public getHistory(): Message[] {
    return [...this.currentState.messages];
  }

  public getToolContext(): ToolContext {
    return { ...this.currentState.toolContext };
  }

  public checkpoint(): string {
    const checkpointId = this.generateCheckpointId();
    const checkpoint: Checkpoint = {
      checkpointId: checkpointId,
      timestamp: Date.now(),
      messages: [...this.currentState.messages],
      toolContext: { ...this.currentState.toolContext },
    };
    this.checkpoints.set(checkpointId, checkpoint);
    return checkpointId;
  }

  public getCheckpointIds(): string[] {
    return Array.from(this.checkpoints.keys());
  }

  public getCheckpoint(checkpointId: string): Checkpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  public restore(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return false;
    }

    this.currentState.messages = [...checkpoint.messages];
    this.currentState.toolContext = { ...checkpoint.toolContext };
    return true;
  }

  public addMessage(message: Message): void {
    this.currentState.messages.push(message);
  }

  public updateToolContext(context: ToolContext): void {
    this.currentState.toolContext = {
      ...this.currentState.toolContext,
      ...context,
    };
  }

  public getLatestCheckpointId(): string | undefined {
    if (this.checkpoints.size === 0) {
      return undefined;
    }
    // Simple heuristic: return the ID of the first checkpoint created
    return this.checkpoints.keys().next().value;
  }
}