import { describe, it, expect } from "vitest";
import { AgentContext, EventFilterRule } from "../src/context/contextual-event-filter";

const mockEvent = { type: "user_input", data: "Hello world" };
const mockContext: AgentContext = {
  history: [{ role: "user", content: "Initial message" }],
  current_tool_state: { toolA: "state1" },
};

describe("EventFilterRule", () => {
  it("should return true if the event type matches a configured rule", () => {
    const rule: EventFilterRule = (event, context) => {
      if (event.type === "user_input") {
        return true;
      }
      return false;
    };
    expect(rule(mockEvent, mockContext)).toBe(true);
  });

  it("should return false if the event type does not match any configured rule", () => {
    const rule: EventFilterRule = (event, context) => {
      if (event.type === "system_message") {
        return true;
      }
      return false;
    };
    expect(rule(mockEvent, mockContext)).toBe(false);
  });

  it("should consider context when filtering events based on tool state", () => {
    const rule: EventFilterRule = (event, context) => {
      if (event.type === "tool_call" && context.current_tool_state.toolA === "state1") {
        return true;
      }
      return false;
    };
    const toolEvent = { type: "tool_call", data: {} };
    expect(rule(toolEvent, mockContext)).toBe(true);

    const wrongContext: AgentContext = {
      history: [],
      current_tool_state: { toolA: "state2" },
    };
    expect(rule(toolEvent, wrongContext)).toBe(false);
  });
});