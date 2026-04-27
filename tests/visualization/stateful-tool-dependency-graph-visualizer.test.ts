import { describe, it, expect } from "vitest";
import { StatefulToolDependencyGraphVisualizer } from "../src/visualization/stateful-tool-dependency-graph-visualizer";
import { ToolInvocationRecord, GraphStateUpdate } from "../src/visualization/types";

describe("StatefulToolDependencyGraphVisualizer", () => {
  it("should return an empty array of updates when no history is loaded", () => {
    const visualizer = new StatefulToolDependencyGraphVisualizer();
    const updates = visualizer.processUpdates();
    expect(updates).toEqual([]);
  });

  it("should process a single tool invocation record correctly", () => {
    const visualizer = new StatefulToolDependencyGraphVisualizer();
    const mockRecord: ToolInvocationRecord = {
      toolName: "toolA",
      invocationId: "inv1",
      timestamp: Date.now(),
      toolUseBlock: {
        type: "toolUse",
        toolName: "toolA",
        invocationId: "inv1",
        arguments: {
          param1: "value1",
        },
      },
      thinkingBlock: {
        type: "thinking",
        content: "Thinking about toolA",
      },
    };
    visualizer.loadHistory([mockRecord]);
    const updates: GraphStateUpdate[] = visualizer.processUpdates();
    expect(updates.length).toBe(1);
    expect(updates[0].type).toBe("ToolUse");
  });

  it("should process multiple sequential tool invocation records", () => {
    const visualizer = new StatefulToolDependencyGraphVisualizer();
    const mockRecord1: ToolInvocationRecord = {
      toolName: "toolA",
      invocationId: "inv1",
      timestamp: Date.now() - 100,
      toolUseBlock: {
        type: "toolUse",
        toolName: "toolA",
        invocationId: "inv1",
        arguments: {
          param1: "value1",
        },
      },
      thinkingBlock: {
        type: "thinking",
        content: "Thinking about toolA",
      },
    };
    const mockRecord2: ToolInvocationRecord = {
      toolName: "toolB",
      invocationId: "inv2",
      timestamp: Date.now(),
      toolUseBlock: {
        type: "toolUse",
        toolName: "toolB",
        invocationId: "inv2",
        arguments: {
          param2: "value2",
        },
      },
      thinkingBlock: {
        type: "thinking",
        content: "Thinking about toolB",
      },
    };
    visualizer.loadHistory([mockRecord1, mockRecord2]);
    const updates: GraphStateUpdate[] = visualizer.processUpdates();
    expect(updates.length).toBe(2);
    expect(updates[0].type).toBe("ToolUse");
    expect(updates[1].type).toBe("ToolUse");
  });
});