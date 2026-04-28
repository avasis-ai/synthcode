import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TemporalRelationship,
  GraphNode,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v138";

describe("GraphNode", () => {
  it("should correctly structure a tool_execution node", () => {
    const node: GraphNode = {
      id: "tool1",
      label: "Tool Execution",
      type: "tool_execution",
      metadata: {
        toolName: "search",
        startTime: 1678886400,
        endTime: 1678886460,
        constraints: [
          { resourceName: "api_key", requiredAmount: 1, unit: "key" },
        ],
        temporal: {
          startTime: 1678886400,
          endTime: 1678886460,
        },
      },
    };
    expect(node.id).toBe("tool1");
    expect(node.type).toBe("tool_execution");
    expect(node.metadata.toolName).toBe("search");
  });

  it("should correctly structure a user_input node", () => {
    const node: GraphNode = {
      id: "user_msg_1",
      label: "User Query",
      type: "user_input",
      metadata: {
        content: "What is the weather like?",
        timestamp: 1678886400,
      },
    };
    expect(node.id).toBe("user_msg_1");
    expect(node.type).toBe("user_input");
    expect(node.metadata.content).toBe("What is the weather like?");
  });

  it("should correctly structure an assistant_response node", () => {
    const node: GraphNode = {
      id: "assistant_resp_1",
      label: "Assistant Reply",
      type: "assistant_response",
      metadata: {
        content: "The weather is sunny.",
        timestamp: 1678886460,
      },
    };
    expect(node.id).toBe("assistant_resp_1");
    expect(node.type).toBe("assistant_response");
    expect(node.metadata.content).toBe("The weather is sunny.");
  });
});