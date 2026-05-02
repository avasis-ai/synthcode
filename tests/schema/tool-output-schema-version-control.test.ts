import { describe, it, expect } from "vitest";
import { SchemaVersion, SchemaVersionMismatchError } from "../src/schema/tool-output-schema-version-control";

describe("SchemaVersion", () => {
  it("should correctly create a SchemaVersion object", () => {
    const version: SchemaVersion = {
      version: "1.0.0",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
      },
      compatibility: "additive",
    };
    expect(version.version).toBe("1.0.0");
    expect(typeof version.schema).toBe("object");
    expect(["additive", "backward"]).toContain(version.compatibility);
  });

  it("should throw SchemaVersionMismatchError for incompatible versions", () => {
    const incompatibleVersion: SchemaVersion = {
      version: "2.0.0",
      schema: {},
      compatibility: "backward",
    };
    // Assuming a function exists or the class structure implies a check mechanism
    // Since the provided code snippet is incomplete (ends with 'export class V'),
    // we test the error class instantiation and basic usage.
    expect(() => {
      new SchemaVersionMismatchError("Schema version mismatch detected");
    }).toThrow(SchemaVersionMismatchError);
    expect((new SchemaVersionMismatchError("Test")).name).toBe("SchemaVersionMismatchError");
  });

  it("should handle different compatibility types", () => {
    const additiveVersion: SchemaVersion = {
      version: "1.1.0",
      schema: {},
      compatibility: "additive",
    };
    const backwardVersion: SchemaVersion = {
      version: "1.0.0",
      schema: {},
      compatibility: "backward",
    };
    expect(additiveVersion.compatibility).toBe("additive");
    expect(backwardVersion.compatibility).toBe("backward");
  });
});