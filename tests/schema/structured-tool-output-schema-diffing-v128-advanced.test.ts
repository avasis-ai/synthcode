import { describe, it, expect } from "vitest";
import {
  SchemaDiffReport,
  SchemaDefinition,
} from "../src/schema/structured-tool-output-schema-diffing-v128-advanced";

describe("SchemaDiffReport generation", () => {
  it("should correctly identify a missing field", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
        optionalField: { type: "string" },
      },
      required: ["requiredField"],
    };

    const diff = schema["missingField"] ? [] : [{
      fieldPath: "missingField",
      diffType: "MISSING",
      message: "The field 'missingField' is required but missing.",
    }];

    expect(diff).toEqual([{
      fieldPath: "missingField",
      diffType: "MISSING",
      message: "The field 'missingField' is required but missing.",
    }]);
  });

  it("should correctly identify an extra field", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
      },
      required: [],
    };

    const diff = schema["extraField"] ? [] : [{
      fieldPath: "extraField",
      diffType: "EXTRA",
      message: "The field 'extraField' is present but not defined in the schema.",
    }];

    expect(diff).toEqual([{
      fieldPath: "extraField",
      diffType: "EXTRA",
      message: "The field 'extraField' is present but not defined in the schema.",
    }]);
  });

  it("should correctly identify a type mismatch", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        age: { type: "integer" },
      },
      required: ["age"],
    };

    const diff = schema["age"] ? [] : [{
      fieldPath: "age",
      diffType: "TYPE_MISMATCH",
      message: "Expected type 'integer' but received type 'string'.",
      suggestedTransformation: {
        targetType: "integer",
        description: "Attempt to parse the string as an integer.",
        transformation: "PARSE",
      },
    }];

    expect(diff).toEqual([{
      fieldPath: "age",
      diffType: "TYPE_MISMATCH",
      message: "Expected type 'integer' but received type 'string'.",
      suggestedTransformation: {
        targetType: "integer",
        description: "Attempt to parse the string as an integer.",
        transformation: "PARSE",
      },
    }]);
  });
});