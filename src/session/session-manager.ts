import { Store } from "../memory/store";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export interface SessionState {
  sessionId: string;
  history: Message[];
  context: Record<string, any>;
  lastUpdated: number;
}

export class SessionManager {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  async initializeSession(sessionId: string, initialContext: Record<string, any>): Promise<SessionState> {
    const state: SessionState = {
      sessionId: sessionId,
      history: [],
      context: initialContext,
      lastUpdated: Date.now(),
    };
    await this.saveState(state);
    return state;
  }

  async loadState(sessionId: string): Promise<SessionState | null> {
    const state = await this.store.get<SessionState>(sessionId);
    return state;
  }

  async saveState(state: SessionState): Promise<void> {
    state.lastUpdated = Date.now();
    await this.store.set(state.sessionId, state);
  }

  async updateHistory(sessionId: string, newMessage: Message): Promise<SessionState> {
    const currentState = await this.loadState(sessionId);

    if (!currentState) {
      throw new Error(`Cannot update history: Session ${sessionId} not found.`);
    }

    const newHistory = [...currentState.history, newMessage];
    const newState: SessionState = {
      ...currentState,
      history: newHistory,
      lastUpdated: Date.now(),
    };

    await this.saveState(newState);
    return newState;
  }
}