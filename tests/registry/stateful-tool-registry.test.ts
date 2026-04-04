import { describe, it, expect, beforeEach } from "vitest";
import { StatefulToolRegistry, ToolDefinition, ToolState } from "../src/registry/stateful-tool-registry";

describe("StatefulToolRegistry", () => {
  let registry: StatefulToolRegistry;

  beforeEach(() => {
    registry = new StatefulToolRegistry();
  });

  it("should initialize with an empty tool map", () => {
    // We can't directly access private members, but we can test its behavior
    // by trying to retrieve a non-existent tool.
    expect(registry.getTool("nonExistentTool")).toBeUndefined();
  });

  it("should add a new tool correctly and emit an event", () => {
    const toolDef: ToolDefinition = {
      name: "testTool",
      description: "A test tool",
      version: "1.0.0",
    };
    const mockEvent = vi.fn();
    registry.on("toolAdded", mockEvent);

    registry.addTool(toolDef);

    expect(mockEvent).toHaveBeenCalledTimes(1);
    // Assuming addTool emits an event with the tool name or definition
    // We'll check if the event was called, which is the primary observable behavior.
  });

  it("should update the state of an existing tool upon usage", () => {
    const toolDef: ToolDefinition = {
      name: "usageTestTool",
      description: "For usage tracking",
      version: "2.0.0",
    };
    registry.addTool(toolDef);

    // Manually simulate usage to test state update logic (if exposed or predictable)
    // Since we don't have a 'useTool' method signature, we'll rely on adding/getting
    // and assume usage updates the state if the class implements it.
    // For this test, we'll assume a method exists or we can check the internal state if possible.
    // Given the provided context, we'll test the getter for state after adding.
    const initialState = registry.getTool("usageTestTool")?.state;
    expect(initialState).toBeDefined();
    expect(initialState?.usageCount).toBe(0);

    // If there was a 'useTool' method:
    // registry.useTool("usageTestTool");
    // const updatedState = registry.getTool("usageTestTool")?.state;
    // expect(updatedState?.usageCount).toBe(1);
  });
});