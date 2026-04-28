import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV49,
  SchemaMerger,
  ContextualConstraintResolver,
  ValidationStep,
} from "../src/validation/structured-tool-input-validation-pipeline-v49";

describe("StructuredToolInputValidationPipelineV49", () => {
  it("should correctly merge base schema with context", () => {
    const mockMerger: SchemaMerger = {
      merge: (baseSchema, context) => ({
        ...baseSchema,
        ...context,
      }),
    };
    const pipeline = new StructuredToolInputValidationPipelineV49(
      mockMerger,
      null,
      null
    );
    const baseSchema = {
      name: "string",
      age: "number",
    };
    const context = {
      age: 30,
      location: "city",
    };
    const mergedSchema = pipeline.mergeSchemas(baseSchema, context);
    expect(mergedSchema).toEqual({
      name: "string",
      age: 30,
      location: "city",
    });
  });

  it("should resolve contextually constrained fields", () => {
    const mockResolver: ContextualConstraintResolver = {
      resolve: (context, currentSchema) => ({
        ...currentSchema,
        city: "resolved_city",
      }),
    };
    const pipeline = new StructuredToolInputValidationPipelineV49(
      null,
      mockResolver,
      null
    );
    const context = {
      user_id: "user123",
    };
    const resolvedSchema = pipeline.resolveContextualConstraints(
      context,
      {
        user_id: "string",
        city: "string",
      }
    );
    expect(resolvedSchema).toEqual({
      user_id: "string",
      city: "resolved_city",
    });
  });

  it("should execute all validation steps sequentially", () => {
    const mockMerger: SchemaMerger = {
      merge: (baseSchema, context) => ({
        ...baseSchema,
        ...context,
      }),
    };
    const mockResolver: ContextualConstraintResolver = {
      resolve: (context, currentSchema) => ({
        ...currentSchema,
        resolved: true,
      }),
    };
    const mockStep: ValidationStep = {
      execute: (input, context, merger) => {
        if (input["required_field"] === "fail") {
          throw new Error("Validation failed");
        }
        return {
          result: "success",
        };
      },
    };
    const pipeline = new StructuredToolInputValidationPipelineV49(
      mockMerger,
      mockResolver,
      [mockStep]
    );
    const input = {
      required_field: "ok",
      other_field: "value",
    };
    const context = {
      user_id: "test",
    };
    const result = pipeline.validate(input, context);
    expect(result).toEqual({
      result: "success",
    });
  });
});