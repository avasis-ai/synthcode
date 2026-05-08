import { describe, it, expect } from "vitest";
import { AuditTrailManager } from "../src/audit/audit-trail-manager";

describe("AuditTrailManager", () => {
  it("should initialize correctly with an empty trail", () => {
    const manager = new AuditTrailManager();
    expect(manager.getTrail()).toEqual([]);
  });

  it("should add a user message to the trail", () => {
    const manager = new AuditTrailManager();
    const userMessage = { role: "user", content: "Hello world" };
    manager.addMessage(userMessage);
    expect(manager.getTrail()).toHaveLength(1);
    expect(manager.getTrail()[0]).toEqual(userMessage);
  });

  it("should append multiple message types to the trail", () => {
    const manager = new AuditTrailManager();
    const userMessage = { role: "user", content: "Initial prompt" };
    const assistantMessage = { role: "assistant", content: [] };
    const toolResultMessage = { role: "tool", tool_use_id: "id1", content: "Tool output" };

    manager.addMessage(userMessage);
    manager.addMessage(assistantMessage);
    manager.addMessage(toolResultMessage);

    const trail = manager.getTrail();
    expect(trail).toHaveLength(3);
    expect(trail[0]).toEqual(userMessage);
    expect(trail[1]).toEqual(assistantMessage);
    expect(trail[2]).toEqual(toolResultMessage);
  });
});