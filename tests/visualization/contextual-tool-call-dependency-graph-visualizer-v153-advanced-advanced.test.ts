import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizer } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v153-advanced-advanced";
import { Message, ToolUseBlock, ThinkingBlock } from "../src/visualization/types";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic message structure", () => {
    const messages: Message[] = [
      { role: "user", content: "Initial query" },
      { role: "assistant", content: "Thinking..." },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(messages);
    expect(visualizer).toBeDefined();
    // Assuming the visualizer has a method or property to check initialization state
    // We'll check if it can process the basic structure without error.
    expect(() => visualizer.render()).not.toThrow();
  });

  it("should handle a scenario with explicit tool use and dependencies", () => {
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      content: [{
        toolUse: {
          id: "tool_call_1",
          name: "search_engine",
          input: { query: "weather" },
          dependencies: [
            { sourceId: "user_input", targetId: "search_engine", type: "direct" },
          ],
        },
      }],
    };
    const messages: Message[] = [
      { role: "user", content: "What's the weather?", blocks: [
        { type: "text", content: "What's the weather?" }
      ]},
      { role: "assistant", content: "Calling tool...", blocks: [
        { type: "tool_use", content: [{ toolUse: toolUseBlock.content[0].toolUse }] }
      ]}
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(messages);
    // Check if the visualizer processes the tool use block structure
    expect(() => visualizer.render()).not.toThrow();
  });

  it("should correctly visualize a sequence involving thinking and multiple tool calls", () => {
    const thinkingBlock: ThinkingBlock = {
      type: "thinking",
      content: [{ type: "text", content: "Thinking about the plan..." }],
    };
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      content: [{
        toolUse: {
          id: "tool_call_2",
          name: "database_query",
          input: { user_id: "123" },
          dependencies: [
            { sourceId: "context_data", targetId: "database_query", type: "contextual" },
          ],
        },
      }],
    };
    const messages: Message[] = [
      { role: "user", content: "Analyze user profile.", blocks: [
        { type: "text", content: "Analyze user profile." }
      ]},
      { role: "assistant", content: "Thinking...", blocks: [
        thinkingBlock
      ]},
      { role: "assistant", content: "Calling tool...", blocks: [
        { type: "tool_use", content: [{ toolUse: toolUseBlock.content[0].toolUse }] }
      ]}
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(messages);
    // A more complex scenario check
    expect(() => visualizer.render()).not.toThrow();
  });
});