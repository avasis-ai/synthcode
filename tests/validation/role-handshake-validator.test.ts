import { describe, it, expect } from "vitest";
import { RoleHandshakeValidator } from "../src/validation/role-handshake-validator";

describe("RoleHandshakeValidator", () => {
  it("should validate a successful user-to-assistant handshake", () => {
    const validator = new RoleHandshakeValidator();
    const context: any = {
      sourceRole: "user",
      targetRole: "assistant",
      payload: {
        content: {
          type: "text",
          text: "Hello, how can I help?",
        },
      },
    };
    expect(validator.isValid(context)).toBe(true);
  });

  it("should validate a successful assistant-to-tool handshake", () => {
    const validator = new RoleHandshakeValidator();
    const context: any = {
      sourceRole: "assistant",
      targetRole: "tool",
      payload: {
        content: {
          type: "tool_use",
          tool_use: {
            tool_name: "get_weather",
            input: { location: "London" },
          },
        },
      },
    };
    expect(validator.isValid(context)).toBe(true);
  });

  it("should fail validation for an invalid role transition (e.g., tool to user)", () => {
    const validator = new RoleHandshakeValidator();
    const context: any = {
      sourceRole: "tool",
      targetRole: "user",
      payload: {
        content: {
          type: "text",
          text: "This transition is invalid.",
        },
      },
    };
    expect(validator.isValid(context)).toBe(false);
  });
});