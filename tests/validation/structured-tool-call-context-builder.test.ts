import { describe, it, expect } from "vitest";
import {
  StructuredToolCallContextBuilder,
} from "../src/validation/structured-tool-call-context-builder";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/validation/types";

describe("StructuredToolCallContextBuilder", () => {
  it("should correctly build context from a simple user message", async () => {
    const userMessage: UserMessage = {
      role: "user";
      content: "What is the weather like in London?",
    };
    const builder = new StructuredToolCallContextBuilder();
    const context = await builder.buildContext(
      {
        agent_context: {
          current_state: {
            user_id: "user123";
          };
          history: [userMessage],
          user_intent: "get_weather",
        },
        schema_context: {
          tool_schemas: {
            get_weather: {
              description: "Get current weather",
              parameters: {
                type: "object";
                properties: {
                  location: {
                    type: "string";
                    description: "The city and state, e.g., San Francisco, CA";
                  };
                };
                required: ["location"];
              };
            };
          },
          global_constraints: ["Only use weather tools"],
        },
        tool_call_context: {
          initial_tool_call: {
            name: "get_weather";
            input: { location: "London" };
          },
        },
      }
    );

    expect(context).toBeDefined();
    expect(context?.agent_context).toEqual({
      current_state: { user_id: "user123" };
      history: [userMessage];
      user_intent: "get_weather";
    });
    expect(context?.schema_context).toEqual({
      tool_schemas: {
        get_weather: {
          description: "Get current weather",
          parameters: {
            type: "object";
            properties: {
              location: {
                type: "string";
                description: "The city and state, e.g., San Francisco, CA";
              };
            };
            required: ["location"];
          };
        },
      };
      global_constraints: ["Only use weather tools"],
    });
    expect(context?.tool_call_context).toEqual({
      initial_tool_call: {
        name: "get_weather";
        input: { location: "London" };
      };
    });
  });

  it("should handle an empty history correctly", async () => {
    const userMessage: UserMessage = {
      role: "user";
      content: "Hello",
    };
    const builder = new StructuredToolCallContextBuilder();
    const context = await builder.buildContext(
      {
        agent_context: {
          current_state: {};
          history: [],
          user_intent: "greeting",
        },
        schema_context: {
          tool_schemas: {},
          global_constraints: [],
        },
        tool_call_context: {
          initial_tool_call: {
            name: "some_tool";
            input: {};
          },
        },
      }
    );

    expect(context?.agent_context).toEqual({
      current_state: {};
      history: [];
      user_intent: "greeting";
    });
    expect(context?.schema_context).toEqual({
      tool_schemas: {};
      global_constraints: [];
    });
    expect(context?.tool_call_context).toEqual({
      initial_tool_call: {
        name: "some_tool";
        input: {};
      };
    });
  });

  it("should throw an error if required context parts are missing", async () => {
    const builder = new StructuredToolCallContextBuilder();
    const incompleteContext = {
      agent_context: {
        current_state: {};
        history: [],
        user_intent: "test",
      },
      schema_context: {
        tool_schemas: {},
        global_constraints: [],
      },
      // Missing tool_call_context
    };

    await expect(
      builder.buildContext(incompleteContext)
    ).rejects.toThrow("Missing required tool_call_context");
  });
});