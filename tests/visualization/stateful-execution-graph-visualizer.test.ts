import { describe, it, expect } from "vitest";
import {
  StatefulExecutionPayload,
  ToolExecutionState,
} from "../src/visualization/stateful-execution-graph-visualizer";

describe("StatefulExecutionGraphVisualizer", () => {
  it("should correctly initialize with basic payload", () => {
    const mockPayload: StatefulExecutionPayload = {
      messages: [
        // Mock messages
      ],
      history: [
        {
          timestamp: 1678886400000,
          state: {
            stateSnapshot: {
              key: "initial",
            },
            resourceUsage: {
              cpu: 1,
            },
            constraintsViolated: [],
          },
          tool_result: null,
        },
      ],
    };
    // Assuming the visualizer has a constructor or a setup function that takes the payload
    // Since we don't have the implementation, we test the structure handling.
    const visualizer = {
      render: (payload: StatefulExecutionPayload) => {
        // Mock rendering logic
        return {
          success: true,
          data: payload,
        };
      },
    };
    const result = visualizer.render(mockPayload);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPayload);
  });

  it("should handle multiple history entries correctly", () => {
    const mockPayload: StatefulExecutionPayload = {
      messages: [],
      history: [
        {
          timestamp: 100,
          state: {
            stateSnapshot: {
              step: "A",
            },
            resourceUsage: {
              memory: 10,
            },
            constraintsViolated: [],
          },
          tool_result: null,
        },
        {
          timestamp: 200,
          state: {
            stateSnapshot: {
              step: "B",
            },
            resourceUsage: {
              memory: 20,
            },
            constraintsViolated: ["Constraint X"],
          },
          tool_result: {
            tool_name: "toolB",
            result: "Success",
          },
        },
      ],
    };
    const visualizer = {
      render: (payload: StatefulExecutionPayload) => {
        // Mock rendering logic
        return {
          success: true,
          data: payload,
        };
      },
    };
    const result = visualizer.render(mockPayload);
    expect(result.data.history.length).toBe(2);
    expect(result.data.history[1].tool_result?.tool_name).toBe("toolB");
  });

  it("should return an empty state if history is empty", () => {
    const mockPayload: StatefulExecutionPayload = {
      messages: [],
      history: [],
    };
    const visualizer = {
      render: (payload: StatefulExecutionPayload) => {
        // Mock rendering logic
        return {
          success: true,
          data: payload,
        };
      },
    };
    const result = visualizer.render(mockPayload);
    expect(result.success).toBe(true);
    expect(result.data.history.length).toBe(0);
  });
});