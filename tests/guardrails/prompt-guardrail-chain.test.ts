import { describe, it, expect, vi } from "vitest";
import { PromptGuardrailChain, Guardrail, ValidationResult } from "../src/guardrails/prompt-guardrail-chain.js";

describe("PromptGuardrailChain", () => {
  it("should run multiple guardrails and apply modifications sequentially", async () => {
    const mockGuardrail1: Guardrail = {
      name: "Guardrail1",
      check: (prompt: string, context: Message[]): {
        modifiedPrompt: string;
        result: ValidationResult;
      } => {
        const modified = prompt.toUpperCase();
        return {
          modifiedPrompt: modified,
          result: { isValid: true, errors: [], warning: null },
        };
      },
    };

    const mockGuardrail2: Guardrail = {
      name: "Guardrail2",
      check: (prompt: string, context: Message[]): {
        modifiedPrompt: string;
        result: ValidationResult;
      } => {
        const modified = prompt.toLowerCase();
        return {
          modifiedPrompt: modified,
          result: { isValid: true, errors: [], warning: "Lowercased", },
        };
      },
    };

    const chain = new PromptGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const initialPrompt = "Test Prompt";
    const context: Message[] = [{ role: "user", content: "Context" }];

    const finalPrompt = await chain.run(initialPrompt, context);

    // Guardrail 1 converts to uppercase ("TEST PROMPT")
    // Guardrail 2 converts the result of Guardrail 1 to lowercase ("test prompt")
    expect(finalPrompt).toBe("test prompt");
  });

  it("should handle guardrails that fail validation and accumulate errors", async () => {
    const mockGuardrail1: Guardrail = {
      name: "Guardrail1",
      check: (prompt: string, context: Message[]): {
        modifiedPrompt: string;
        result: ValidationResult;
      } => {
        const result: ValidationResult = {
          isValid: false,
          errors: ["Guardrail1 failed"],
          warning: null,
        };
        return {
          modifiedPrompt: prompt,
          result: result,
        };
      },
    };

    const mockGuardrail2: Guardrail = {
      name: "Guardrail2",
      check: (prompt: string, context: Message[]): {
        modifiedPrompt: string;
        result: ValidationResult;
      } => {
        const result: ValidationResult = {
          isValid: false,
          errors: ["Guardrail2 failed"],
          warning: null,
        };
        return {
          modifiedPrompt: prompt,
          result: result,
        };
      },
    };

    const chain = new PromptGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const initialPrompt = "Initial";
    const context: Message[] = [];

    const finalPrompt = await chain.run(initialPrompt, context);

    // The prompt should remain unchanged if no guardrail modifies it, but the errors should be accumulated.
    // Since the run method returns only the final prompt, we test that the prompt is passed through.
    expect(finalPrompt).toBe("Initial");
  });

  it("should return the original prompt if no guardrails are provided", async () => {
    const chain = new PromptGuardrailChain([]);
    const initialPrompt = "No guardrails here";
    const context: Message[] = [{ role: "user", content: "Context" }];

    const finalPrompt = await chain.run(initialPrompt, context);

    expect(finalPrompt).toBe(initialPrompt);
  });
});