import { describe, it, expect } from "vitest";
import {
  ConflictResolutionStrategy,
  MergeReport,
} from "../src/schema/structured-tool-output-schema-merger-v1029-advanced-advanced";

describe("StructuredToolOutputSchemaMergerV1029AdvancedAdvanced", () => {
  it("should merge two simple schemas with no conflicts", () => {
    const schema1: any = {
      name: "tool_output",
      type: "object",
      properties: {
        id: {type: "string"},
        status: {type: "string"},
      },
    };
    const schema2: any = {
      name: "tool_output",
      type: "object",
      properties: {
        timestamp: {type: "string"},
      },
    };

    const result: MergeReport = require("../src/schema/structured-tool-output-schema-merger-v1029-advanced-advanced").merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.SemanticMerge
    );

    expect(result.conflicts).toHaveLength(0);
    expect(result.finalSchema.properties).toHaveProperty("id");
    expect(result.finalSchema.properties).toHaveProperty("status");
    expect(result.finalSchema.properties).toHaveProperty("timestamp");
  });

  it("should handle conflicts using PreferLatest strategy", () => {
    const schema1: any = {
      properties: {
        fieldA: {type: "string", description: "A from 1"},
        fieldB: {type: "number"},
      },
    };
    const schema2: any = {
      properties: {
        fieldA: {type: "boolean", description: "A from 2"},
        fieldC: {type: "string"},
      },
    };

    const result: MergeReport = require("../src/schema/structured-tool-output-schema-merger-v1029-advanced-advanced").merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.PreferLatest
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].field).toBe("fieldA");
    expect(result.conflicts[0].resolution).toBe("prefer_latest");
    expect(result.finalSchema.properties.fieldA).toEqual(
      schema2.properties.fieldA
    );
    expect(result.finalSchema.properties.fieldC).toBeDefined();
  });

  it("should correctly report conflicts when types mismatch", () => {
    const schema1: any = {
      properties: {
        mixedField: {type: "string"},
      },
    };
    const schema2: any = {
      properties: {
        mixedField: {type: "integer"},
      },
    };

    const result: MergeReport = require("../src/schema/structured-tool-output-schema-merger-v1029-advanced-advanced").merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.SemanticMerge
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].field).toBe("mixedField");
    expect(result.conflicts[0].resolution).toBe("semantic_merge");
    // In semantic merge, if types conflict, the resulting schema might adopt a union or a more general type,
    // but for this test, we check that a conflict was reported.
    expect(result.finalSchema.properties).toHaveProperty("mixedField");
  });
});