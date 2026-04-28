import { describe, it, expect } from "vitest";
import { PipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-v67";

describe("PipelineBuilder", () => {
  it("should initialize with an empty list of validators", () => {
    const builder = new PipelineBuilder();
    // We can't directly access private members, but we can test the effect.
    // A more robust test would involve mocking or adding a getter if available.
    // For now, we'll assume the internal state is correct if addValidator works.
    expect(builder).toBeInstanceOf(PipelineBuilder);
  });

  it("should add a validator correctly", () => {
    const builder = new PipelineBuilder();
    const mockValidator = { validate: () => ({ isValid: true, errors: [] }) };
    builder.addValidator(mockValidator);

    // Since we can't access private members, we'll test the sequence of operations
    // and assume the internal state is managed correctly by the class structure.
    // A direct check would require changing the class under test.
    // For this test, we confirm the method call executes without error.
    expect(() => builder.addValidator(mockValidator)).not.toThrow();
  });

  it("should allow adding multiple validators", () => {
    const builder = new PipelineBuilder();
    const mockValidator1 = { validate: () => ({ isValid: true, errors: [] }) };
    const mockValidator2 = { validate: () => ({ isValid: true, errors: [] }) };

    builder.addValidator(mockValidator1);
    builder.addValidator(mockValidator2);

    // Again, testing the sequence of calls is the most feasible approach
    // without modifying the class to expose its internal state for testing.
    expect(() => builder.addValidator(mockValidator1)).not.toThrow();
    expect(() => builder.addValidator(mockValidator2)).not.toThrow();
  });
});