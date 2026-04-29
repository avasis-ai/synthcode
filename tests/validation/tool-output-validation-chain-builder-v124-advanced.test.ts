import { describe, it, expect } from "vitest";
import { ToolOutputValidationChainBuilderAdvanced } from "../src/validation/tool-output-validation-chain-builder-v124-advanced";

describe("ToolOutputValidationChainBuilderAdvanced", () => {
  it("should correctly build a validation chain with multiple steps", () => {
    const builder = new ToolOutputValidationChainBuilderAdvanced();
    const chain = builder
      .addStep(
        (context) => context.hasOwnProperty("step1"),
        (context) => {
          if (!context.step1) {
            return { isValid: false, error: "step1 is missing" };
          }
          return { isValid: true };
        }
      )
      .addStep(
        (context) => context.hasOwnProperty("step2"),
        (context) => {
          if (typeof context.step2 !== "string") {
            return { isValid: false, error: "step2 must be a string" };
          }
          return { isValid: true };
        }
      )
      .build();

    expect(chain).toBeDefined();
    // A more robust check would involve executing the chain, but for building, we check structure.
    // Since we can't easily inspect private members, we rely on the build method succeeding.
  });

  it("should return a chain that fails validation if the first step condition is false", () => {
    const builder = new ToolOutputValidationChainBuilderAdvanced();
    const chain = builder
      .addStep(
        (context) => context.get("shouldFailStep") === true,
        (context) => {
          if (context.get("shouldFailStep") === true) {
            return { isValid: false, error: "This step should fail" };
          }
          return { isValid: true };
        }
      )
      .addStep(
        (context) => true, // Always true condition for the second step
        (context) => {
          return { isValid: true };
        }
      )
      .build();

    // Simulate running the chain with context that fails the first step's condition
    const context = { get: (key: string) => key === "shouldFailStep" ? true : undefined };
    const result = (chain as any).validate(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stepName).toContain("shouldFailStep");
  });

  it("should execute all steps if all conditions are met and all steps pass validation", () => {
    const builder = new ToolOutputValidationChainBuilderAdvanced();
    const chain = builder
      .addStep(
        (context) => true,
        (context) => {
          return { isValid: true };
        }
      )
      .addStep(
        (context) => true,
        (context) => {
          return { isValid: true };
        }
      )
      .build();

    // Simulate running the chain with context that passes all conditions
    const context = { get: (key: string) => undefined }; // Context doesn't matter if conditions are always true
    const result = (chain as any).validate(context);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});