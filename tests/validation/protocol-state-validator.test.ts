import { describe, it, expect } from "vitest";
import { ProtocolStateValidator } from "../src/validation/protocol-state-validator.js";

describe("ProtocolStateValidator", () => {
    it("should correctly validate a sequence of messages against a defined protocol schema", () => {
        const validator = new ProtocolStateValidator({
            steps: [
                {
                    role: "user",
                    payloadValidator: (payload) => typeof payload.text === "string" && payload.text.length > 0,
                    requiredMessageType: class UserMessage extends Message {}
                },
                {
                    role: "assistant",
                    payloadValidator: (payload) => typeof payload.text === "string",
                    requiredMessageType: class AssistantMessage extends Message {}
                },
                {
                    role: "tool",
                    payloadValidator: (payload) => typeof payload.toolName === "string",
                    requiredMessageType: class ToolResultMessage extends Message {}
                }
            ],
            initialStepIndex: 0,
            transitions: {
                0: [1], // User -> Assistant
                1: [2], // Assistant -> Tool
                2: []    // Tool ends the protocol
            }
        });

        // Valid sequence: User -> Assistant -> Tool
        const validSequence = [
            { message: new (class UserMessage extends Message {})({ text: "Hello" }) },
            { message: new (class AssistantMessage extends Message {})({ text: "Hi there" }) },
            { message: new (class ToolResultMessage extends Message {})({ toolName: "search" }) }
        ];

        expect(validator.isValid(validSequence)).toBe(true);
    });

    it("should return false if the sequence violates the transition rules", () => {
        const validator = new ProtocolStateValidator({
            steps: [
                {
                    role: "user",
                    payloadValidator: (payload) => true,
                    requiredMessageType: class UserMessage extends Message {}
                },
                {
                    role: "assistant",
                    payloadValidator: (payload) => true,
                    requiredMessageType: class AssistantMessage extends Message {}
                }
            ],
            initialStepIndex: 0,
            transitions: {
                0: [1] // Only User -> Assistant is allowed
            }
        });

        // Invalid sequence: User -> User (violates transition 0 -> 1)
        const invalidSequence = [
            { message: new (class UserMessage extends Message {})({}) },
            { message: new (class UserMessage extends Message {})({}) }
        ];

        expect(validator.isValid(invalidSequence)).toBe(false);
    });

    it("should return false if any message fails its payload validation or type check", () => {
        const validator = new ProtocolStateValidator({
            steps: [
                {
                    role: "user",
                    payloadValidator: (payload) => typeof payload.text === "string" && payload.text.length > 0,
                    requiredMessageType: class UserMessage extends Message {}
                },
                {
                    role: "assistant",
                    payloadValidator: (payload) => typeof payload.text === "string",
                    requiredMessageType: class AssistantMessage extends Message {}
                }
            ],
            initialStepIndex: 0,
            transitions: {
                0: [1]
            }
        });

        // Invalid sequence: User (valid) -> Assistant (invalid payload)
        const invalidSequence = [
            { message: new (class UserMessage extends Message {})({ text: "Valid user input" }) },
            { message: new (class AssistantMessage extends Message {})({}) } // Missing text
        ];

        expect(validator.isValid(invalidSequence)).toBe(false);
    });
});