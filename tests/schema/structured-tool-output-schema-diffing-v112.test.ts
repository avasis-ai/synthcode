import { describe, it, expect } from "vitest";
import {
  DiffLevel,
  FieldSchema,
  SchemaDiffReport,
} from "../src/schema/structured-tool-output-schema-diffing-v112";

describe("SchemaDiffReport", () => {
  it("should correctly report no differences when schemas are identical", () => {
    const schema1: Record<string, FieldSchema> = {
      name: {
        type: "string";
        description: "The name";
        required: true;
      },
    };
    const schema2: Record<string, FieldSchema> = {
      name: {
        type: "string";
        description: "The name";
        required: true;
      },
    };

    const report = schema1.diff(schema2);
    expect(report.diffLevel).toBe(DiffLevel.NONE);
    expect(report.fieldDiffs).toEqual({});
  });

  it("should report a minor difference when a field's description changes", () => {
    const schema1: Record<string, FieldSchema> = {
      name: {
        type: "string";
        description: "Old description";
        required: true;
      },
      age: {
        type: "number";
        description: "User's age";
        required: false;
      },
    };
    const schema2: Record<string, FieldSchema> = {
      name: {
        type: "string";
        description: "New description";
        required: true;
      },
      age: {
        type: "number";
        description: "User's age";
        required: false;
      },
    };

    const report = schema1.diff(schema2);
    expect(report.diffLevel).toBe(DiffLevel.MINOR);
    expect(report.fieldDiffs).toHaveProperty("name");
    expect(report.fieldDiffs.name).toEqual({
      diffLevel: DiffLevel.MINOR,
      changes: {
        description: "Old description",
        newValue: "New description",
      },
    });
  });

  it("should report a major difference when a field is added or removed", () => {
    const schema1: Record<string, FieldSchema> = {
      id: {
        type: "string";
        description: "Unique ID";
        required: true;
      },
    };
    const schema2: Record<string, FieldSchema> = {
      id: {
        type: "string";
        description: "Unique ID";
        required: true;
      },
      email: {
        type: "string";
        description: "User email";
        required: false;
      },
    };

    const report = schema1.diff(schema2);
    expect(report.diffLevel).toBe(DiffLevel.MAJOR);
    expect(report.fieldDiffs).toHaveProperty("email");
    expect(report.fieldDiffs.email).toEqual({
      diffLevel: DiffLevel.MAJOR,
      changes: {
        added: true,
      },
    });
  });
});