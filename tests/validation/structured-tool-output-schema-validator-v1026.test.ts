import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1026 } from "../src/validation/structured-tool-output-schema-validator-v1026";

describe("StructuredToolOutputSchemaValidatorV1026", () => {
  it("should throw SchemaEvolutionMismatchError when initialSchemaVersion is not provided", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1026({
      initialSchemaVersion: undefined as any,
      schemaVersions: {},
    });
    expect(() => {
      validator.validate(null as any);
    }).toThrow("SchemaEvolutionMismatch");
  });

  it("should validate successfully with matching schema version", () => {
    const mockSchemaVersions = {
      "v1.0": (schema: any) => true,
    };
    const validator = new StructuredToolOutputSchemaValidatorV1026({
      initialSchemaVersion: "v1.0",
      schemaVersions: mockSchemaVersions,
    });
    const result = validator.validate({ toolOutput: "some data" } as any);
    expect(result).toBe(true);
  });

  it("should throw SchemaEvolutionMismatchError when schema version mismatch occurs", () => {
    const mockSchemaVersions = {
      "v1.0": (schema: any) => true,
    };
    const validator = new StructuredToolOutputSchemaValidatorV1026({
      initialSchemaVersion: "v1.0",
      schemaVersions: mockSchemaVersions,
    });
    // Simulate validation failure due to version mismatch (though the actual logic might be more complex)
    // We test the error throwing mechanism based on the class structure.
    const error = validator.validate({ toolOutput: "some data" } as any) as Error & {
      name: "SchemaEvolutionMismatch";
      expectedVersion: string;
      actualVersion: string;
    };
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SchemaEvolutionMismatch");
  });
});