import { Message } from "./types";

export interface TemporalContextWindow {
  startTime: number;
  endTime: number;
}

export interface ContextItem {
  context: Message;
  window: TemporalContextWindow;
}

export class TemporalContextWindowManager {
  private contextStore: Map<string, ContextItem>;

  constructor() {
    this.contextStore = new Map<string, ContextItem>();
  }

  addContext(id: string, context: Message, window: TemporalContextWindow): void {
    if (window.startTime > window.endTime) {
      throw new Error("Start time cannot be after end time.");
    }
    this.contextStore.set(id, { context, window });
  }

  isContextValid(id: string, checkTime: number = Date.now()): boolean {
    const item = this.contextStore.get(id);
    if (!item) {
      return false;
    }
    const { window } = item;
    return checkTime >= window.startTime && checkTime <= window.endTime;
  }

  getValidContexts(checkTime: number = Date.now()): ContextItem[] {
    const validContexts: ContextItem[] = [];
    for (const [id, item] of this.contextStore.entries()) {
      if (item.window.startTime <= checkTime && item.window.endTime >= checkTime) {
        validContexts.push(item);
      }
    }
    return validContexts;
  }

  pruneStaleContexts(checkTime: number = Date.now()): void {
    const staleIds: string[] = [];
    for (const [id, item] of this.contextStore.entries()) {
      const { window } = item;
      // Check if the current time is outside the window
      if (checkTime < window.startTime || checkTime > window.endTime) {
        staleIds.push(id);
      }
    }

    staleIds.forEach(id => {
      this.contextStore.delete(id);
    });
  }

  getStoreSize(): number {
    return this.contextStore.size;
  }
}