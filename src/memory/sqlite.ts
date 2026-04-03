import type { MemoryStore } from "./store.js";
import type { Message } from "../types.js";
import { InMemoryStore } from "./store.js";

function jsonSerialize(messages: Message[]): string {
  return JSON.stringify(messages, (_, value) => {
    if (value === undefined) return "__UNDEFINED__";
    return value;
  });
}

function jsonDeserialize(str: string): Message[] {
  return JSON.parse(str, (_, value) => {
    if (value === "__UNDEFINED__") return undefined;
    return value;
  });
}

export class SQLiteStore implements MemoryStore {
  private store: MemoryStore;

  constructor(dbPath?: string) {
    try {
      const Database = require("better-sqlite3");
      const db = new Database(dbPath ?? "./synth-memory.db");
      db.pragma("journal_mode = WAL");
      db.exec(`
        CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY,
          messages TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          message_count INTEGER NOT NULL DEFAULT 0
        )
      `);
      try {
        db.exec("ALTER TABLE threads ADD COLUMN message_count INTEGER NOT NULL DEFAULT 0");
      } catch {
        // column already exists
      }
      this.store = {
        async getThread(threadId: string): Promise<Message[]> {
          const row = db.prepare("SELECT messages FROM threads WHERE id = ?").get(threadId);
          if (!row) return [];
          return jsonDeserialize(row.messages);
        },
        async saveThread(threadId: string, messages: Message[]): Promise<void> {
          const now = Date.now();
          const json = jsonSerialize(messages);
          const msgCount = messages.length;
          const exists = db.prepare("SELECT 1 FROM threads WHERE id = ?").get(threadId);
          const stmt = exists
            ? db.prepare("UPDATE threads SET messages = ?, updated_at = ?, message_count = ? WHERE id = ?")
            : db.prepare("INSERT INTO threads (id, messages, updated_at, message_count) VALUES (?, ?, ?, ?)");
          stmt.run(json, now, msgCount, threadId);
        },
        async appendMessage(threadId: string, message: Message): Promise<void> {
          const row = db.prepare("SELECT messages FROM threads WHERE id = ?").get(threadId);
          const messages: Message[] = row ? jsonDeserialize(row.messages) : [];
          messages.push(message);
          const json = jsonSerialize(messages);
          const now = Date.now();
          db.prepare("INSERT INTO threads (id, messages, updated_at, message_count) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET messages = excluded.messages, updated_at = excluded.updated_at, message_count = excluded.message_count")
            .run(threadId, json, now, messages.length);
        },
        async listThreads(opts?: { limit?: number; before?: string }): Promise<Array<{ id: string; updatedAt: number; messageCount: number }>> {
          const rows = db.prepare("SELECT id, updated_at, message_count FROM threads ORDER BY updated_at DESC").all();
          let results = rows.map((r: any) => ({ id: r.id, updatedAt: r.updated_at, messageCount: r.message_count }));
          if (opts?.before) results = results.filter((e: { updatedAt: number }) => e.updatedAt < parseInt(opts.before!, 10));
          return results.slice(0, opts?.limit ?? 100);
        },
        async deleteThread(threadId: string): Promise<void> {
          db.prepare("DELETE FROM threads WHERE id = ?").run(threadId);
        },
      };
    } catch {
      console.warn("[synth] better-sqlite3 not available, falling back to in-memory store. Install it with: npm install better-sqlite3");
      this.store = new InMemoryStore();
    }
  }

  async getThread(threadId: string): Promise<Message[]> { return this.store.getThread(threadId); }
  async saveThread(threadId: string, messages: Message[]): Promise<void> { return this.store.saveThread(threadId, messages); }
  async appendMessage(threadId: string, message: Message): Promise<void> { return this.store.appendMessage(threadId, message); }
  async listThreads(opts?: { limit?: number; before?: string }): Promise<Array<{ id: string; updatedAt: number; messageCount: number }>> { return this.store.listThreads(opts); }
  async deleteThread(threadId: string): Promise<void> { return this.store.deleteThread(threadId); }
}
