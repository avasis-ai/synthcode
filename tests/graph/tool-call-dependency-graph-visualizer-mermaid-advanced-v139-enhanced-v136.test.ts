import { describe, it, expect } from "vitest";
import {
  GraphContext,
  FlowControlNode,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-enhanced-v136";

describe("GraphContext", () => {
  it("should correctly initialize with basic message structure", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Hello" } as UserMessage,
        { role: "assistant", content: "Hi there" } as AssistantMessage,
      ],
      dependencies: {},
    };
    expect(context.messages).toHaveLength(2);
    expect(context.dependencies).toEqual({});
  });

  it("should handle complex dependency structure", () => {
    const context: GraphContext = {
      messages: [],
      dependencies: {
        "nodeA": {
          from: "start",
          to: "nodeA",
          metadata: {
            flow_control: {
              type: "conditional",
              description: "Check condition",
              condition: "success",
              next_nodes: ["nodeB", "nodeC"],
            },
          },
        },
      },
    };
    expect(context.dependencies).toHaveProperty("nodeA");
    expect(context.dependencies.nodeA?.metadata?.flow_control?.type).toBe("conditional");
  });

  it("should allow adding multiple nodes with different flow control types", () => {
    const context: GraphContext = {
      messages: [],
      dependencies: {
        "node1": {
          from: "start",
          to: "node1",
          metadata: {
            flow_control: {
              type: "loop_exit",
              description: "Exit loop",
              next_nodes: [],
            },
          },
        },
        "node2": {
          from: "node1",
          to: "node2",
          metadata: {
            flow_control: {
              type: "manual_step",
              description: "Manual review",
            },
          },
        },
      },
    };
    expect(context.dependencies).toHaveProperty("node1");
    expect(context.dependencies).toHaveProperty("node2");
    expect(context.dependencies.node1?.metadata?.flow_control?.type).toBe("loop_exit");
    expect(context.dependencies.node2?.metadata?.flow_control?.type).toBe("manual_step");
  });
});