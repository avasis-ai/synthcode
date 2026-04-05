import { describe, it, expect } from "vitest";
import { GraphContext } from "../types";
import {
  GraphContextInput,
  GraphContextOutput,
} from "../tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor";

describe("GraphContextInput", () => {
  it("should correctly generate a basic graph structure from simple messages", async () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Hello world" } as UserMessage,
        { role: "assistant", content: "Hi there!" } as AssistantMessage,
      ],
      toolCalls: [],
      flowControlPoints: [],
      nodes: {
        "node1": { id: "node1", type: "user", content: "Hello world" },
        "node2": { id: "node2", type: "assistant", content: "Hi there!" },
      },
    };

    const result: GraphContextOutput = await GraphContextInput(context);

    expect(result.mermaidCode).toContain("graph TD");
    expect(result.mermaidCode).toContain("node1[User: Hello world]");
    expect(result.mermaidCode).toContain("node2[Assistant: Hi there!]");
  });

  it("should handle tool calls and dependencies correctly", async () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Get weather for London" } as UserMessage,
      ],
      toolCalls: [
        { id: "tool1", name: "get_weather", input: { location: "London" } },
      ],
      flowControlPoints: [],
      nodes: {
        "node1": { id: "node1", type: "user", content: "Get weather for London" },
      },
    };

    const result: GraphContextOutput = await GraphContextInput(context);

    expect(result.mermaidCode).toContain("tool1(get_weather)");
    expect(result.mermaidCode).toContain("node1 --> tool1");
  });

  it("should incorporate flow control points like conditionals", async () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Check status" } as UserMessage,
      ],
      toolCalls: [],
      flowControlPoints: [
        {
          type: "conditional",
          condition: "status == 'success'",
          sourceNodeId: "node1",
          targetNodeId: "node_success",
          details: { message: "Success path" },
        },
      ],
      nodes: {
        "node1": { id: "node1", type: "user", content: "Check status" },
        "node_success": { id: "node_success", type: "conditional", content: "Success path" },
        "node_failure": { id: "node_failure", type: "conditional", content: "Failure path" },
      },
    };

    const result: GraphContextOutput = await GraphContextInput(context);

    expect(result.mermaidCode).toContain("node1 -->|status == 'success'| node_success");
    expect(result.mermaidCode).toContain("node1 -->|status != 'success'| node_failure");
  });
});