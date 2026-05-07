import { describe, it, expect } from "vitest";
import { InteractionProtocolNegotiator } from "../src/negotiation/interaction-protocol-negotiator.js";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/negotiation/types.js";

describe("InteractionProtocolNegotiator", () => {
  it("should initialize with a valid protocol contract", () => {
    const contract = {
      initialState: "START",
      states: {
        "START": {
          [UserMessage.name]: {
            allowedMessageTypes: [
              "UserMessage"
            ],
            validate: (message, currentState) => ({ isValid: true }),
            nextState: "USER_INPUT"
          }
        }
      }
    };
    const negotiator = new InteractionProtocolNegotiator(contract);
    expect(negotiator).toBeDefined();
    expect(negotiator.getCurrentState()).toBe("START");
  });

  it("should transition state correctly upon receiving a valid user message", () => {
    const contract = {
      initialState: "START",
      states: {
        "START": {
          [UserMessage.name]: {
            allowedMessageTypes: ["UserMessage"],
            validate: (message, currentState) => ({ isValid: true }),
            nextState: "USER_INPUT"
          }
        }
      }
    };
    const negotiator = new InteractionProtocolNegotiator(contract);
    const userMessage: UserMessage = {
      type: "UserMessage",
      content: [
        { type: "TextBlock", text: "Hello" }
      ]
    };
    negotiator.processMessage(userMessage);
    expect(negotiator.getCurrentState()).toBe("USER_INPUT");
  });

  it("should reject transition and remain in current state upon receiving an invalid message type", () => {
    const contract = {
      initialState: "START",
      states: {
        "START": {
          [UserMessage.name]: {
            allowedMessageTypes: ["UserMessage"],
            validate: (message, currentState) => ({ isValid: true }),
            nextState: "USER_INPUT"
          }
        }
      }
    };
    const negotiator = new InteractionProtocolNegotiator(contract);
    const invalidMessage: AssistantMessage = {
      type: "AssistantMessage",
      content: []
    };
    negotiator.processMessage(invalidMessage);
    expect(negotiator.getCurrentState()).toBe("START");
  });
});