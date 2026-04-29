import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputSchemaMerger,
  ConflictResolutionStrategy,
  StructuredSchema,
} from "../src/schema/structured-tool-output-schema-merger-v1000_advanced";
import { z } from "zod";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should correctly merge two simple schemas using 'overwrite' strategy", () => {
    const schemaA: StructuredSchema = {
      properties: {
        name: {
          description: "The name",
          required: true,
          schema: z.string(),
        },
        age: {
          description: "The age",
          required: false,
          schema: z.number(),
        },
      },
      required: ["name"],
    };

    const schemaB: StructuredSchema = {
      properties: {
        name: {
          description: "The full name",
          required: true,
          schema: z.string().min(1),
        },
        email: {
          description: "The email address",
          required: true,
          schema: z.string().email(),
        },
      },
      required: ["name", "email"],
    };

    const merger = new StructuredToolOutputSchemaMerger(
      ConflictResolutionStrategy.Overwrite
    );
    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema.properties.name.schema).toBe(
      z.string().min(1)
    );
    expect(mergedSchema.properties.email).toBeDefined();
    expect(mergedSchema.required).toEqual(["name", "email"]);
  });

  it("should handle merging when one field is missing in the second schema", () => {
    const schemaA: StructuredSchema = {
      properties: {
        id: {
          description: "The ID",
          required: true,
          schema: z.string(),
        },
        optionalField: {
          description: "Optional",
          required: false,
          schema: z.boolean(),
        },
      },
      required: ["id"],
    };

    const schemaB: StructuredSchema = {
      properties: {
        id: {
          description: "The unique ID",
          required: true,
          schema: z.string().uuid(),
        },
      },
      required: ["id"],
    };

    const merger = new StructuredToolOutputSchemaMerger(
      ConflictResolutionStrategy.Overwrite
    );
    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema.properties.id.schema).toBe(
      z.string().uuid()
    );
    expect(mergedSchema.properties.optionalField).toBeDefined();
    expect(mergedSchema.required).toEqual(["id", "optionalField"]);
  });

  it("should correctly merge using 'keep_a' strategy for conflicting fields", () => {
    const schemaA: StructuredSchema = {
      properties: {
        key: {
          description: "Key A",
          required: true,
          schema: z.number(),
        },
      },
      required: ["key"],
    };

    const schemaB: StructuredSchema = {
      properties: {
        key: {
          description: "Key B",
          required: true,
          schema: z.string(),
        },
      },
      required: ["key"],
    };

    const merger = new StructuredToolOutputSchemaMerger(
      ConflictResolutionStrategy.KeepA
    );
    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema.properties.key.schema).toBe(z.number());
    expect(mergedSchema.properties.key.description).toBe("Key A");
  });
});