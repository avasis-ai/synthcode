import { describe, it, expect } from "vitest";
import { InMemoryStore } from "../src/memory/store.js";

describe("InMemoryStore", () => {
  it("saves and retrieves threads", async () => {
    const store = new InMemoryStore();
    const messages = [{ role: "user" as const, content: "hello" }];
    await store.saveThread("t1", messages);
    const retrieved = await store.getThread("t1");
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].content).toBe("hello");
  });

  it("returns empty for missing thread", async () => {
    const store = new InMemoryStore();
    expect(await store.getThread("nonexistent")).toHaveLength(0);
  });

  it("appends messages", async () => {
    const store = new InMemoryStore();
    await store.saveThread("t1", [{ role: "user" as const, content: "a" }]);
    await store.appendMessage("t1", { role: "assistant" as const, content: "b" });
    const retrieved = await store.getThread("t1");
    expect(retrieved).toHaveLength(2);
    expect(retrieved[1].content).toBe("b");
  });

  it("lists threads sorted by updated_at", async () => {
    const store = new InMemoryStore();
    await store.saveThread("old", [{ role: "user" as const, content: "a" }]);
    await new Promise((r) => setTimeout(r, 5));
    await store.saveThread("new", [{ role: "user" as const, content: "b" }]);
    const threads = await store.listThreads();
    expect(threads).toHaveLength(2);
    expect(threads[0].id).toBe("new");
  });

  it("deletes threads", async () => {
    const store = new InMemoryStore();
    await store.saveThread("t1", [{ role: "user" as const, content: "a" }]);
    await store.deleteThread("t1");
    expect(await store.getThread("t1")).toHaveLength(0);
  });
});
