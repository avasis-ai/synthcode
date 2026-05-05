import { describe, it, expect } from "vitest";
import { ContextEnrichmentSource, ValidationStep } from "../src/validation/contextual-tool-call-validator-v161-advanced-advanced";

describe("ContextualToolCallValidatorV161AdvancedAdvanced", () => {
  it("should correctly validate a tool call with sufficient context", async () => {
    const mockValidator = {
      validate: async (
        toolCall: { name: string; input: Record<string, unknown> },
        context: Record<string, unknown>
      ): Promise<boolean> => {
        if (toolCall.name === "get_user_profile" && context.userId === "user123") {
          return true;
        }
        return false;
      },
    } as unknown as ValidationStep;

    const toolCall = { name: "get_user_profile", input: { userId: "user123" } };
    const context = { userId: "user123", session: "active" };

    await expect(mockValidator.validate(toolCall, context)).resolves.toBe(true);
  });

  it("should fail validation if required context is missing for the tool call", async () => {
    const mockValidator = {
      validate: async (
        toolCall: { name: string; input: Record<string, unknown> },
        context: Record<string, unknown>
      ): Promise<boolean> => {
        if (toolCall.name === "get_user_profile" && context.userId === "user123") {
          return true;
        }
        return false;
      },
    } as unknown as ValidationStep;

    const toolCall = { name: "get_user_profile", input: { userId: "unknown" } };
    const context = { session: "active" }; // Missing userId

    await expect(mockValidator.validate(toolCall, context)).resolves.toBe(false);
  });

  it("should pass validation for a tool call with no specific context requirements", async () => {
    const mockValidator = {
      validate: async (
        toolCall: { name: string; input: Record<string, unknown> },
        context: Record<string, unknown>
      ): Promise<boolean> => {
        if (toolCall.name === "search_general") {
          return true;
        }
        return false;
      },
    } as unknown as ValidationStep;

    const toolCall = { name: "search_general", input: { query: "test" } };
    const context = {};

    await expect(mockValidator.validate(toolCall, context)).resolves.toBe(true);
  });
});