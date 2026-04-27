import { describe, it, expect } from "vitest";
import { ToolInputSchemaDriftDetector } from "../src/drift/tool-input-schema-drift-detector";

describe("ToolInputSchemaDriftDetector", () => {
  it("should detect type drift when an expected field has a different type", () => {
    const expectedSchema = {
      "user_id": { type: "string" },
      "age": { type: "number" },
    };
    const detector = new ToolInputSchemaDriftDetector(expectedSchema);
    const actualInput = {
      user_id: 123, // Should be string, is number
      age: "twenty", // Should be number, is string
    };

    const report = detector.detectDrift(actualInput);

    expect(report).toHaveLength(2);
    expect(report).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "user_id",
          expectedType: "string",
          actualType: "number",
          isMissing: false,
          isExtra: false,
        }),
        expect.objectContaining({
          field: "age",
          expectedType: "number",
          actualType: "string",
          isMissing: false,
          isExtra: false,
        }),
      ])
    );
  });

  it("should detect missing fields", () => {
    const expectedSchema = {
      "required_field": { type: "string" },
      "optional_field": { type: "boolean" },
    };
    const detector = new ToolInputSchemaDriftDetector(expectedSchema);
    const actualInput = {
      "required_field": "some_value",
    };

    const report = detector.detectDrift(actualInput);

    expect(report).toHaveLength(1);
    expect(report[0]).toEqual({
      field: "optional_field",
      expectedType: "boolean",
      actualType: "unknown",
      isMissing: true,
      isExtra: false,
    });
  });

  it("should detect extra fields", () => {
    const expectedSchema = {
      "field_a": { type: "string" },
    };
    const detector = new ToolInputSchemaDriftDetector(expectedSchema);
    const actualInput = {
      "field_a": "value",
      "extra_field": 42,
    };

    const report = detector.detectDrift(actualInput);

    expect(report).toHaveLength(1);
    expect(report[0]).toEqual({
      field: "extra_field",
      expectedType: "unknown",
      actualType: "number",
      isMissing: false,
      isExtra: true,
    });
  });
});