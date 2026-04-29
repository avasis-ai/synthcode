import { describe, it, expect } from "vitest";
import {
  SemanticContextGraphDiffingAdvanced,
  GraphDiffingOptions,
} from "../src/graph/semantic-context-graph-diffing-advanced";

describe("SemanticContextGraphDiffingAdvanced", () => {
  it("should correctly diff two simple graphs with minimal changes", async () => {
    const graph1 = {
      messages: [
        { type: "user", content: [{ type: "text", text: "Hello" }] },
        { type: "assistant", content: [{ type: "text", text: "Hi there!" }] },
      ],
    };
    const graph2 = {
      messages: [
        { type: "user", content: [{ type: "text", text: "Hello" }] },
        { type: "assistant", content: [{ type: "text", text: "Hello, how are you?" }] },
      ],
    };

    const diff = await SemanticContextGraphDiffingAdvanced.diff(
      graph1,
      graph2,
      {}
    );

    expect(diff).toEqual({
      diff: [
        {
          type: "message_update",
          message_index: 1,
          diff: {
            content: [
              { type: "text", diff: { text: "Hi there!" } },
            ],
          },
        },
      ],
    });
  });

  it("should detect additions and removals of messages", async () => {
    const graph1 = {
      messages: [
        { type: "user", content: [{ type: "text", text: "First message" }] },
        { type: "assistant", content: [{ type: "text", text: "Second message" }] },
      ],
    };
    const graph2 = {
      messages: [
        { type: "user", content: [{ type: "text", text: "First message" }] },
        { type: "user", content: [{ type: "text", text: "New user message" }] },
        { type: "assistant", content: [{ type: "text", text: "Second message" }] },
      ],
    };

    const diff = await SemanticContextGraphDiffingAdvanced.diff(
      graph1,
      graph2,
      {}
    );

    expect(diff).toEqual({
      diff: [
        {
          type: "message_addition",
          message_index: 1,
          message: {
            type: "user",
            content: [{ type: "text", text: "New user message" }],
          },
        },
      ],
    });
  });

  it("should handle complex content block changes like tool use", async () => {
    const graph1 = {
      messages: [
        {
          type: "user",
          content: [
            { type: "text", text: "What is the weather?" },
            { type: "tool_use", id: "tool1", name: "get_weather", input: { location: "London" } },
          ],
        },
      ],
    };
    const graph2 = {
      messages: [
        {
          type: "user",
          content: [
            { type: "text", text: "What is the weather?" },
            { type: "tool_use", id: "tool1", name: "get_weather", input: { location: "Paris" } },
          ],
        },
      ],
    };

    const diff = await SemanticContextGraphDiffingAdvanced.diff(
      graph1,
      graph2,
      {}
    );

    expect(diff).toEqual({
      diff: [
        {
          type: "content_update",
          message_index: 0,
          diff: {
            content: [
              {
                type: "tool_use",
                diff: { input: { location: "Paris" } },
              },
            ],
          },
        },
      ],
    });
  });
});