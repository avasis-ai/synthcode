import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/tool/schema-merger";
import { z } from "zod";

describe("SchemaMerger", () => {
  it("should merge simple types correctly when new value is provided", () => {
    const targetSchema = z.object({
      id: z.string(),
      name: z.string(),
    });
    const merger = new SchemaMerger(targetSchema);

    const result = merger.merge({
      id: "new-id",
      name: "New Name",
    });

    expect(result).toEqual({
      id: "new-id",
      name: "New Name",
    });
  });

  it("should keep the existing value if the new value is null or undefined", () => {
    const targetSchema = z.object({
      id: z.string().default("default-id"),
      optionalField: z.string().optional().default("default-optional"),
    });
    const merger = new SchemaMerger(targetSchema);

    const existingData = {
      id: "existing-id",
      optionalField: "existing-optional",
    };

    const result = merger.merge({
      id: undefined,
      optionalField: null,
    });

    expect(result).toEqual({
      id: "existing-id",
      optionalField: "existing-optional",
    });
  });

  it("should prioritize the new value when it is a valid type and not null/undefined", () => {
    const targetSchema = z.object({
      count: z.number().default(1),
      isActive: z.boolean().default(false),
    });
    const merger = new SchemaMerger(targetSchema);

    const existingData = {
      count: 10,
      isActive: true,
    };

    const result = merger.merge({
      count: 20,
      isActive: true,
    });

    expect(result).toEqual({
      count: 20,
      isActive: true,
    });
  });
});