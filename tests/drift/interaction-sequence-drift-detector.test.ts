import { describe, it, expect } from "vitest";
import { InteractionSequenceDriftDetector } from "../src/drift/interaction-sequence-drift-detector";

describe("InteractionSequenceDriftDetector", () => {
  it("should detect drift when the sequence changes from user input to tool result", () => {
    const detector = new InteractionSequenceDriftDetector();
    const userMessage = { type: "user", content: "What is the capital of France?", timestamp: 1678886400 };
    const toolResultMessage = { type: "tool_result", tool_call_id: "tool_1", content: "Paris", timestamp: 1678886405 };

    detector.processEvent({ type: "USER_INPUT", source: userMessage });
    const drift1 = detector.isDrifting();
    expect(drift1).toBe(false);

    detector.processEvent({ type: "TOOL_RESULT", source: toolResultMessage });
    const drift2 = detector.isDrifting();
    expect(drift2).toBe(true);
  });

  it("should not detect drift when the sequence remains within the same type (e.g., multiple user inputs)", () => {
    const detector = new InteractionSequenceDriftDetector();
    const userMessage1 = { type: "user", content: "Hello", timestamp: 1678886400 };
    const userMessage2 = { type: "user", content: "How are you?", timestamp: 1678886410 };

    detector.processEvent({ type: "USER_INPUT", source: userMessage1 });
    expect(detector.isDrifting()).toBe(false);

    detector.processEvent({ type: "USER_INPUT", source: userMessage2 });
    expect(detector.isDrifting()).toBe(false);
  });

  it("should detect drift when transitioning from a thought step to a user input", () => {
    const detector = new InteractionSequenceDriftDetector();
    const thinkingStep = { type: "thinking", thinking: "Thinking about the user's query..." };
    const userMessage = { type: "user", content: "Tell me more.", timestamp: 1678886420 };

    detector.processEvent({ type: "THOUGHT_STEP", source: thinkingStep });
    expect(detector.isDrifting()).toBe(false);

    detector.processEvent({ type: "USER_INPUT", source: userMessage});
    expect(detector.isDrifting()).toBe(true);
  });
});