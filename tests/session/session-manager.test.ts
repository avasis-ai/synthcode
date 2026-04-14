import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../src/session/session-manager";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    // Re-initialize the manager before each test to ensure isolation
    sessionManager = new SessionManager();
  });

  it("should initialize with an empty session storage", () => {
    // We can't directly access private members, but we can test the behavior
    // by checking if adding a session works correctly.
    const sessionId = "test-session-1";
    sessionManager.createSession(sessionId);
    // A simple check to ensure the internal map is not empty after creation
    // (This relies on the implementation detail that createSession populates storage)
    expect(sessionManager.getStorageSize()).toBe(1);
  });

  it("should correctly store and retrieve session state", () => {
    const sessionId = "state-test-session";
    const initialState: any = {
      history: [],
      metadata: { user: "testuser" },
    };
    sessionManager.createSession(sessionId, initialState);

    const retrievedState = sessionManager.getSessionState(sessionId);
    expect(retrievedState).toEqual(initialState);
  });

  it("should update the session state when provided with new data", () => {
    const sessionId = "update-test-session";
    sessionManager.createSession(sessionId, { history: [] });

    const updateData: any = {
      history: [{ role: "user", content: "New message" }],
      lastUpdated: Date.now(),
    };
    sessionManager.updateSessionState(sessionId, updateData);

    const currentState = sessionManager.getSessionState(sessionId);
    expect(currentState.history).toEqual([{ role: "user", content: "New message" }]);
    expect(currentState.lastUpdated).toBe(updateData.lastUpdated);
  });
});