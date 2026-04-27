import { describe, it, expect } from "vitest";
import { StatefulToolOutputSchemaValidator } from "../src/validation/stateful-tool-output-schema-validator";

describe("StatefulToolOutputSchemaValidator", () => {
  it("should validate correctly when input matches schema and update state", () => {
    const validator = new StatefulToolOutputSchemaValidator();
    const schema: any = {
      id: { type: "string", required: true },
      count: { type: "number", required: false },
    };
    const currentState: any = { initialCount: 10 };
    const input: any = { id: "test-123", count: 20 };

    const result = validator.validate(input, currentState, schema);

    expect(result.isValid).toBe(true);
    expect(result.newState).toEqual({ ...currentState, lastValidatedId: "test-123", count: 20 });
  });

  it("should return invalid if required field is missing", () => {
    const validator = new StatefulToolOutputSchemaValidator();
    const schema: any = {
      requiredField: { type: "string", required: true },
      optionalField: { type: "string", required: false },
    };
    const currentState: any = {};
    const input: any = { optionalField: "some value" };

    const result = validator.validate(input, currentState, schema);

    expect(result.isValid).toBe(false);
    expect(result.newState).toEqual(currentState);
  });

  it("should handle type mismatch gracefully", () => {
    const validator = new StatefulToolOutputSchemaValidator();
    const schema: any = {
      numericField: { type: "number", required: true },
    };
    const currentState: any = {};
    const input: any = { numericField: "not a number" };

    const result = validator.validate(input, currentState, schema);

    expect(result.isValid).toBe(false);
    expect(result.newState).toEqual(currentState);
  });
});