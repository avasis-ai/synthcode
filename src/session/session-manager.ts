import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface SessionState {
  [key: string]: any;
}

export class SessionManager {
  private storage: Map<string, SessionState> = new Map();

  private static getStorage(): Map<string, SessionState> {
    // In a real application, this would interact with a database or external cache.
    // For this simulation, we use an in-memory Map.
    return new Map();
  }

  private static getStorageInstance(): Map<string, SessionState> {
    // Simple singleton pattern for the simulated storage layer
    if (!SessionManager.storageInstance) {
      SessionManager.storageInstance = new Map();
    }
    return SessionManager.storageInstance;
  }

  private static storageInstance: Map<string, SessionState> = new Map();

  /**
   * Loads the session state from the simulated persistent storage.
   * @param sessionId The unique identifier for the session.
   * @returns The loaded session state, or an empty object if not found.
   */
  loadSession(sessionId: string): SessionState {
    const state = SessionManager.getStorageInstance().get(sessionId);
    if (!state) {
      return {};
    }
    return { ...state };
  }

  /**
   * Saves the current state to the simulated persistent storage.
   * @param sessionId The unique identifier for the session.
   * @param state The structured state data to persist.
   */
  saveSession(sessionId: string, state: Record<string, any>): void {
    const serializableState: SessionState = { ...state };
    SessionManager.getStorageInstance().set(sessionId, serializableState);
  }

  /**
   * Generates a summary string from the structured state to inject into the prompt context.
   * @param state The session state to summarize.
   * @returns A formatted string summary.
   */
  generateContextSummary(state: SessionState): string {
    const keys = Object.keys(state);
    if (keys.length === 0) {
      return "No specific session context provided.";
    }

    let summary = "--- Session Context Summary ---\n";
    summary += "The following structured state variables are active for this session:\n";

    for (const key of keys) {
      const value = state[key];
      let displayValue: string;

      if (typeof value === 'object' && value !== null) {
        try {
          displayValue = JSON.stringify(value, null, 2);
        } catch (e) {
          displayValue = String(value);
        }
      } else {
        displayValue = String(value);
      }

      summary += `\n[${key}]:\n${displayValue.substring(0, Math.min(displayValue.length, 300))}...\n`;
    }
    summary += "\n------------------------------\n";
    return summary;
  }
}