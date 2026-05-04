import { describe, it, expect } from "vitest";
import { ContextualDependencyPayload } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v153";
import { visualize } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v153";

describe("visualize", () => {
  it("should return an empty graph structure for minimal input", () => {
    const payload: ContextualDependencyPayload = {
      messages: [
        { id: "msg1", role: "user", content: "Hello" }
      ],
      toolCalls: [],
      dependencies: []
    };
    const result = visualize(payload);
    expect(result).toEqual({
      nodes: [],
      edges: []
    });
  });

  it("should generate nodes and edges for a single tool call dependency", () => {
    const payload: ContextualDependencyPayload = {
      messages: [
        { id: "msg1", role: "user", content: "What is the weather?" }
      ],
      toolCalls: [
        {
          id: "tool1",
          name: "get_weather",
          input: {
            location: "London"
          },
          contextDiffs: {
            "location": "London"
          },
          constraintSources: ["user_input"]
        }
      ],
      dependencies: [
        {
          sourceId: "msg1",
          targetId: "tool1",
          contextualInfluence: "user_input"
        }
      ]
    };
    const result = visualize(payload);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it("should correctly map multiple messages and tool calls with dependencies", () => {
    const payload: ContextualDependencyPayload = {
      messages: [
        { id: "msg1", role: "user", content: "Plan a trip to Paris." },
        { id: "msg2", role: "assistant", content: "I found some options." }
      ],
      toolCalls: [
        {
          id: "toolA",
          name: "search_flights",
          input: {
            destination: "Paris"
          },
          contextDiffs: {
            "destination": "Paris"
          },
          constraintSources: ["user_input"]
        },
        {
          id: "toolB",
          name: "check_hotels",
          input: {
            city: "Paris"
          },
          contextDiffs: {
            "city": "Paris"
          },
          constraintSources: ["toolA_output"]
        }
      ],
      dependencies: [
        {
          sourceId: "msg1",
          targetId: "toolA",
          contextualInfluence: "initial_query"
        },
        {
          sourceId: "toolA",
          targetId: "toolB",
          contextualInfluence: "flight_result"
        }
      ]
    };
    const result = visualize(payload);
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(2);
  });
});