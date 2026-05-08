import { describe, it, expect } from "vitest";
import {
    DialogueStateTracker,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    Message,
} from "../src/dialogue-state-tracker";

describe("DialogueStateTracker", () => {
    it("should initialize with an empty history", () => {
        const tracker = new DialogueStateTracker();
        expect(tracker.history).toEqual([]);
    });

    it("should add a user message and update the history correctly", () => {
        const tracker = new DialogueStateTracker();
        const userMessage: UserMessage = { role: "user", content: "Hello" };
        tracker.addMessage(userMessage);
        expect(tracker.history).toHaveLength(1);
        expect(tracker.history[0]).toEqual(userMessage);
    });

    it("should add an assistant message and maintain the history order", () => {
        const tracker = new DialogueStateTracker();
        const userMessage: UserMessage = { role: "user", content: "Hi" };
        const assistantMessage: AssistantMessage = {
            role: "assistant",
            content: [],
        };
        tracker.addMessage(userMessage);
        tracker.addMessage(assistantMessage);
        expect(tracker.history).toHaveLength(2);
        expect(tracker.history[1]).toEqual(assistantMessage);
    });
});