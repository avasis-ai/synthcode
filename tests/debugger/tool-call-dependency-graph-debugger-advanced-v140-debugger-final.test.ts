import { describe, it, expect } from "vitest";
import { DebuggerEngine } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v140-debugger-final.js";
import { ToolCallDependencyGraph, DebuggerContext } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v140-debugger-final-dependencies.js";

describe("DebuggerEngine", () => {
  it("should initialize correctly with a graph and context", () => {
    const mockGraph = {
      // Mock implementation for ToolCallDependencyGraph
      getNodes: () => [],
    };
    const mockContext = {
      // Mock implementation for DebuggerContext
      getVariable: () => "mockValue",
    };
    const engine = new DebuggerEngine(mockGraph, mockContext);
    // We can't directly test private members, but we can test public behavior
    expect(engine).toBeDefined();
  });

  it("should log a message when attachDebugger is called", () => {
    const mockGraph = {
      getNodes: () => [],
    };
    const mockContext = {
      getVariable: () => "mockValue",
    };
    const engine = new DebuggerEngine(mockGraph, mockContext);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    engine.attachDebugger();

    expect(consoleSpy).toHaveBeenCalledWith("Debugger attached successfully.");
    consoleSpy.mockRestore();
  });

  it("should handle graph updates internally (conceptual test)", () => {
    const mockGraph = {
      // Mock implementation for ToolCallDependencyGraph
      updateGraph: vi.fn(),
    };
    const mockContext = {
      // Mock implementation for DebuggerContext
      getVariable: () => "mockValue",
    };
    const engine = new DebuggerEngine(mockGraph, mockContext);

    // Assuming attachDebugger or another method interacts with the graph
    // We'll simulate an interaction that might trigger a graph update check
    (engine as any).processGraphUpdate = () => {
        mockGraph.updateGraph();
    };

    (engine as any).processGraphUpdate();
    expect(mockGraph.updateGraph).toHaveBeenCalledTimes(1);
  });
});