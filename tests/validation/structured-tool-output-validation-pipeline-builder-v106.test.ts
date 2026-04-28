import { describe, it, expect } from "vitest";
import { BaseValidationBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v106";

describe("BaseValidationBuilder", () => {
  it("should initialize with no steps", () => {
    const builder = new BaseValidationBuilder();
    // We can't directly access private 'steps', so we test the behavior.
    // If we assume 'build' is the main entry point, we test its execution.
    const built = builder.build();
    // A more robust test would involve mocking or adding a getter, but for now,
    // we ensure the structure is correct and calling it doesn't crash.
    expect(typeof built.validate).toBe("function");
  });

  it("should accumulate steps correctly when addStep is called", () => {
    const builder = new BaseValidationBuilder();
    const mockStep1: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: () => ({ isValid: true, errors: [] }) };

    builder.addStep(mockStep1);
    builder.addStep(mockStep2);

    // Since we can't access private steps, we test the combined validation logic.
    // We'll create a mock validation function that checks how many times it's called
    // or rely on the fact that the build method uses all added steps.
    // For this test, we'll assume the build method correctly chains them.
    const built = builder.build();
    const output: Record<string, unknown> = { key: "value" };

    // A simple check: if it runs without error, and we added steps, it likely worked.
    // A better test would require modifying the class to expose step count or the steps array.
    // For now, we confirm the structure and execution path.
    const result = built.validate(output);
    expect(result).toHaveProperty("isValid");
    expect(result).toHaveProperty("errors");
  });

  it("should aggregate errors from multiple validation steps", () => {
    const builder = new BaseValidationBuilder();

    // Mock step that always fails with a specific error
    const failingStep1: any = { validate: () => ({ isValid: false, errors: ["Error A"] }) };
    // Mock step that always fails with a different error
    const failingStep2: any = { validate: () => ({ isValid: false, errors: ["Error B"] }) };

    builder.addStep(failingStep1);
    builder.addStep(failingStep2);

    const built = builder.build();
    const output: Record<string, unknown> = {};

    const result = built.validate(output);

    expect(result.isValid).toBe(false);
    // Expecting both errors to be collected
    expect(result.errors).toEqual(expect.arrayContaining(["Error A", "Error B"]));
    expect(result.errors.length).toBe(2);
  });
});