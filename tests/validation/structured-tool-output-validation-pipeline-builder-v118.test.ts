import { describe, it, expect } from "vitest";
import { buildStructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-builder-v118";

describe("buildStructuredToolOutputValidationPipeline", () => {
  it("should build a basic pipeline with a single type validation", () => {
    const pipeline = buildStructuredToolOutputValidationPipeline(
      "toolOutput",
      [
        {
          name: "toolName",
          validator: {
            type: "type",
            field: "toolName",
            errorMessage: "Tool name must be a string",
          },
        },
      ]
    );
    expect(pipeline).toHaveLength(1);
    expect(pipeline[0].name).toBe("toolName");
  });

  it("should build a pipeline with multiple validators of different types", () => {
    const pipeline = buildStructuredToolOutputValidationPipeline(
      "toolOutput",
      [
        {
          name: "toolName",
          validator: {
            type: "regex",
            field: "toolName",
            value: "^[a-zA-Z0-9]+$",
            errorMessage: "Tool name must be alphanumeric",
          },
        },
        {
          name: "description",
          validator: {
            type: "required",
            field: "description",
            errorMessage: "Description is required",
          },
        },
        {
          name: "requiredField",
          validator: {
            type: "custom",
            field: "requiredField",
            errorMessage: "Custom validation failed",
          },
        },
      ]
    );
    expect(pipeline).toHaveLength(3);
    expect(pipeline.map(step => step.validator.type)).toEqual(["regex", "required", "custom"]);
  });

  it("should handle an empty validator list gracefully", () => {
    const pipeline = buildStructuredToolOutputValidationPipeline("toolOutput", []);
    expect(pipeline).toHaveLength(0);
  });
});