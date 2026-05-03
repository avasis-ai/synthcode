import { describe, it, expect } from "vitest";
import {
  Intent,
  Context,
  History,
} from "../src/drift/intent-drift-detector";

describe("IntentDriftDetector", () => {
  it("should detect drift when user intent significantly changes from history", () => {
    const history: History = {
      messages: [
        {
          role: "user",
          content: "What is the capital of France?",
        },
        {
          role: "assistant",
          content: "The capital of France is Paris.",
        },
      ],
      tool_calls: [],
    };
    const context: Context = {
      current_state: {
        location: "France",
      },
      last_user_input: "What is the capital of France?",
    };
    const intent: Intent = {
      goal: "Get general knowledge about countries",
      constraints: ["Must be a capital city"],
      expected_tools: [],
    };

    // Simulate a drift scenario (e.g., asking about something completely different)
    const new_user_input = "How do I book a flight to Japan?";
    const drift_detected = (await require("../src/drift/intent-drift-detector")).detect(
      intent,
      context,
      history,
      new_user_input
    );

    expect(drift_detected).toBe(true);
  });

  it("should not detect drift when the user input is closely related to the existing intent", () => {
    const history: History = {
      messages: [
        {
          role: "user",
          content: "I need to find a restaurant near the Eiffel Tower.",
        },
        {
          role: "assistant",
          content: "I can help with that. What cuisine do you prefer?",
        },
      ],
      tool_calls: [],
    };
    const context: Context = {
      current_state: {
        location: "Eiffel Tower area",
      },
      last_user_input: "I need to find a restaurant near the Eiffel Tower.",
    };
    const intent: Intent = {
      goal: "Find local services",
      constraints: ["Must be a restaurant"],
      expected_tools: ["search_local_places"],
    };

    // Simulate a related input
    const new_user_input = "Do you have any Italian places within walking distance?";
    const drift_detected = (await require("../src/drift/intent-drift-detector")).detect(
      intent,
      context,
      history,
      new_user_input
    );

    expect(drift_detected).toBe(false);
  });

  it("should handle empty history and context gracefully", () => {
    const history: History = {
      messages: [],
      tool_calls: [],
    };
    const context: Context = {
      current_state: {},
      last_user_input: "",
    };
    const intent: Intent = {
      goal: "Initial query",
      constraints: [],
      expected_tools: [],
    };

    // Simulate an initial query
    const new_user_input = "Hello, what can you help me with today?";
    const drift_detected = (await require("../src/drift/intent-drift-detector")).detect(
      intent,
      context,
      history,
      new_user_input
    );

    // In the absence of history, it should likely not detect drift unless the input is nonsensical
    expect(drift_detected).toBe(false);
  });
});