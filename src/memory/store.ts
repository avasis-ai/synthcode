import type { Message } from "../types.js";

export interface MemoryStore {
  getThread(threadId: string): Promise<Message[]>;
  saveThread(threadId: string, messages: Message[]): Promise<void>;
  appendMessage(threadId: string, message: Message): Promise<void>;
  listThreads(opts?: { limit?: number; before?: string }): Promise<Array<{ id: string; updatedAt: number; messageCount: number }>>;
  deleteThread(threadId: string): Promise<void>;
}

export class InMemoryStore implements MemoryStore {
  private threads: Map<string, { messages: Message[]; updatedAt: number }> = new Map();

  async getThread(threadId: string): Promise<Message[]> {
    return this.threads.get(threadId)?.messages ?? [];
  }

  async saveThread(threadId: string, messages: Message[]): Promise<void> {
    this.threads.set(threadId, { messages, updatedAt: Date.now() });
  }

  async appendMessage(threadId: string, message: Message): Promise<void> {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.messages.push(message);
      thread.updatedAt = Date.now();
    } else {
      this.threads.set(threadId, { messages: [message], updatedAt: Date.now() });
    }
  }

  async listThreads(opts?: { limit?: number; before?: string }): Promise<Array<{ id: string; updatedAt: number; messageCount: number }>> {
    let entries = Array.from(this.threads.entries())
      .map(([id, data]) => ({ id, updatedAt: data.updatedAt, messageCount: data.messages.length }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    if (opts?.before) entries = entries.filter(e => e.updatedAt < parseInt(opts.before as string, 10));
    return entries.slice(0, opts?.limit ?? 100);
  }

  async deleteThread(threadId: string): Promise<void> {
    this.threads.delete(threadId);
  }
}
