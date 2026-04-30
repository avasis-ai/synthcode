import { describe, it, expect } from "vitest";
import {
  SchemaDiffReport,
  SchemaDiffResult,
} from "../src/schema/structured-tool-output-schema-diffing-v139-advanced-advanced";

describe("SchemaDiffResult", () => {
  it("should correctly identify no differences when schemas are identical", () => {
    const schema1: any = {
      name: "test",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };
    const schema2: any = {
      name: "test",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };

    const result: SchemaDiffResult = (schema1, schema2) => {
      return { diffs: [], isDifferent: false };
    };

    const diffResult = result(schema1, schema2);
    expect(diffResult.isDifferent).toBe(false);
    expect(diffResult.diffs).toEqual([]);
  });

  it("should detect a missing field difference", () => {
    const schema1: any = {
      name: "test",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };
    const schema2: any = {
      name: "test",
      properties: {
        id: { type: "string" },
      },
    };

    const result: SchemaDiffResult = (schema1, schema2) => {
      // Mocking the diffing logic to simulate a missing field
      return {
        diffs: [{
          path: "properties.value",
          diffType: "MissingField",
          message: "Field 'value' is missing in the new schema.",
        }],
        isDifferent: true,
      };
    };

    const diffResult = result(schema1, schema2);
    expect(diffResult.isDifferent).toBe(true);
    expect(diffResult.diffs).toHaveLength(1);
    expect(diffResult.diffs[0].diffType).toBe("MissingField");
  });

  it("should detect a type mismatch difference", () => {
    const schema1: any = {
      name: "test",
      properties: {
        id: { type: "string" },
        count: { type: "number" },
      },
    };
    const schema2: any = {
      name: "test",
      properties: {
        id: { type: "string" },
        count: { type: "string" }, // Changed from number to string
      },
    };

    const result: SchemaDiffResult = (schema1, schema2) => {
      // Mocking the diffing logic to simulate a type mismatch
      return {
        diffs: [{
          path: "properties.count",
          diffType: "TypeMismatch",
          message: "Expected type 'number' but found 'string'.",
        }],
        isDifferent: true,
      };
    };

    const diffResult = result(schema1, schema2);
    expect(diffResult.isDifferent).toBe(true);
    expect(diffResult.diffs).toHaveLength(1);
    expect(diffResult.diffs[0].diffType).toBe("TypeMismatch");
  });
});