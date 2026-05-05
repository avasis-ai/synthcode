import { describe, it, expect } from "vitest";
import {
  StructuredThoughtChainingWithExternalStateUpdateV4,
  ExternalStateUpdateAction,
  ThoughtStepPayload,
} from "../src/thought/structured-thought-chaining-with-external-state-update-v4";

describe("StructuredThoughtChainingWithExternalStateUpdateV4", () => {
  it("should correctly process a simple thought chain without external state updates", async () => {
    const initialInput = "What is the capital of France?";
    const thoughtChain = [
      { type: "thinking", thinking: "The capital of France is Paris." },
      { type: "text", text: "The capital of France is Paris." },
    ];

    const result = await StructuredThoughtChainingWithExternalStateUpdateV4(
      initialInput,
      thoughtChain,
      { initial_state: { user: "test" } }
    );

    expect(result.final_output).toBe("The capital of France is Paris.");
    expect(result.final_state).toEqual({ user: "test" });
  });

  it("should correctly incorporate an external state update action", async () => {
    const initialInput = "Update the user's status.";
    const externalUpdate: ExternalStateUpdateAction = {
      action_type: "update_state",
      target_key: "user_status",
      payload: { status: "active" },
    };
    const thoughtChain: ThoughtStepPayload[] = [
      { type: "thinking", thinking: "I need to update the user status." },
      externalUpdate,
      { type: "text", text: "Status updated successfully." },
    ];

    const initialState = { user_status: "inactive", user: "test" };
    const result = await StructuredThoughtChainingWithExternalStateUpdateV4(
      initialInput,
      thoughtChain,
      { initial_state: initialState }
    );

    expect(result.final_output).toBe("Status updated successfully.");
    expect(result.final_state).toEqual({ ...initialState, user_status: "active" });
  });

  it("should handle a mix of tool use and state updates", async () => {
    const initialInput = "Get weather and update user preference.";
    const toolUse: ThoughtStepPayload = {
      type: "tool_use",
      id: "weather_api",
      name: "get_weather",
      input: { location: "London" },
    };
    const stateUpdate: ExternalStateUpdateAction = {
      action_type: "update_state",
      target_key: "preferred_location",
      payload: { location: "London" },
    };
    const thoughtChain: ThoughtStepPayload[] = [
      { type: "thinking", thinking: "First, I'll get the weather. Then, I'll update the preference." },
      toolUse,
      stateUpdate,
      { type: "text", text: "Weather report generated and preference set." },
    ];

    const initialState = { preferred_location: "Paris" };
    const result = await StructuredThoughtChainingWithExternalStateUpdateV4(
      initialInput,
      thoughtChain,
      { initial_state: initialState }
    );

    expect(result.final_output).toBe("Weather report generated and preference set.");
    expect(result.final_state).toEqual({ ...initialState, preferred_location: "London" });
  });
});