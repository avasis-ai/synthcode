import { describe, it, expect } from "vitest";
import { SessionManager } from "../src/session/session-manager";
import { Store } from "../src/memory/store";

describe("SessionManager", () => {
  it("should initialize a new session correctly", async () => {
    const mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as Store;
    const manager = new SessionManager(mockStore);
    const sessionId = "test-session-id";
    const initialContext = { user: "testuser" };

    const state = await manager.initializeSession(sessionId, initialContext);

    expect(state.sessionId).toBe(sessionId);
    expect(state.history).toEqual([]);
    expect(state.context).toEqual(initialContext);
    expect(state.lastUpdated).toBeGreaterThan(0);
    expect(mockStore.set).toHaveBeenCalledWith(sessionId, expect.objectContaining({}));
  });

  it("should retrieve an existing session state", async () => {
    const mockStore = {
      get: vi.fn().mockResolvedValue({
        sessionId: "existing-session",
        history: [{ type: "user", content: "old message" }],
        context: { source: "api" },
        lastUpdated: 1678886400000,
      }),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as Store;
    const manager = new SessionManager(mockStore);
    const sessionId = "existing-session";

    const state = await manager.initializeSession(sessionId, {});

    expect(state.sessionId).toBe(sessionId);
    expect(state.history).toHaveLength(1);
    expect(state.context).toEqual({ source: "api" });
    expect(mockStore.get).toHaveBeenCalledWith(sessionId);
  });

  it("should update the session state upon message addition", async () => {
    const mockStore = {
      get: vi.fn().mockResolvedValue({
        sessionId: "update-session",
        history: [{ type: "user", content: "initial" }],
        context: {},
        lastUpdated: 1000,
      }),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as Store;
    const manager = new SessionManager(mockStore);
    const sessionId = "update-session";
    const newMessage = { type: "assistant", content: "response" };

    // Mock the internal update logic if necessary, or test the public method that triggers it.
    // Assuming there's a method like addMessage that updates the state.
    // Since we only see initializeSession, we'll simulate the state update check.
    await manager.initializeSession(sessionId, {}); // Re-initialize to set up the state context

    // A proper test would call a method that adds a message and saves.
    // For this example, we assume the state is updated correctly after an operation.
    // We'll just check that the store.set is called after some operation.
    await manager.addMessage(sessionId, newMessage);

    expect(mockStore.set).toHaveBeenCalledTimes(1);
    const savedState = mockStore.set.mock.calls[0][1];
    expect(savedState.history).toHaveLength(2);
    expect(savedState.lastUpdated).toBeGreaterThan(1000);
  });
});