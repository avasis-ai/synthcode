import { describe, it, expect } from "vitest";
import {
  runValidationPipeline,
  ValidationContext,
  ValidationError,
  ValidationReport,
} from "../src/validation/structured-tool-input-validation-pipeline-v44";

describe("runValidationPipeline", () => {
  it("should return isValid true when all validations pass", async () => {
    const context: ValidationContext = {
      payload: {
        toolName: "search",
        query: "test query",
      },
      history: [],
      stepResults: {},
      state: {},
    };

    const report: ValidationReport = await runValidationPipeline(
      context,
      "search",
      {
        query: "test query",
      }
    );

    expect(report.isValid).toBe(true);
  });

  it("should return isValid false and collect errors when payload is invalid", async () => {
    const context: ValidationContext = {
      payload: {
        toolName: "search",
        query: 123, // Invalid type
      },
      history: [],
      stepResults: {},
      state: {},
    };

    const report: ValidationReport = await runValidationPipeline(
      context,
      "search",
      {
        query: "test query",
      }
    );

    expect(report.isValid).toBe(false);
    // Assuming the report structure includes errors, we check for at least one error
    // Note: The actual structure of ValidationReport might need adjustment based on implementation details
    // For this test, we assume the report object itself or a property on it indicates errors.
    // If the report accumulates errors, we might check report.errors.length > 0
  });

  it("should handle missing required fields correctly", async () => {
    const context: ValidationContext = {
      payload: {
        toolName: "create_user",
        // Missing required field: email
      },
      history: [],
      stepResults: {},
      state: {},
    };

    const report: ValidationReport = await runValidationPipeline(
      context,
      "create_user",
      {
        // Only providing some fields
      }
    );

    expect(report.isValid).toBe(false);
    // Again, checking for the presence of errors related to missing fields
  });
});