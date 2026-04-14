import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../../src/session/session-manager.js";

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it("should return empty state for unknown session", () => {
    const state = manager.loadSession("nonexistent");
    expect(state).toEqual({});
  });

  it("should store and retrieve session state", () => {
    manager.saveSession("test-1", { key: "value" });
    const state = manager.loadSession("test-1");
    expect(state.key).toBe("value");
  });

  it("should return a copy of state", () => {
    manager.saveSession("test-2", { key: "value" });
    const state = manager.loadSession("test-2");
    state.key = "modified";
    const original = manager.loadSession("test-2");
    expect(original.key).toBe("value");
  });

  it("should generate context summary for empty state", () => {
    const summary = manager.generateContextSummary({});
    expect(summary).toContain("No specific session context");
  });

  it("should generate context summary for non-empty state", () => {
    const summary = manager.generateContextSummary({ foo: "bar", count: 42 });
    expect(summary).toContain("foo");
    expect(summary).toContain("bar");
    expect(summary).toContain("count");
  });
});
