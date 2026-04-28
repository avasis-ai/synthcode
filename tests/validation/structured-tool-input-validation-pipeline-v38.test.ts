import { describe, it, expect } from "vitest";
import {
  StructuredToolInputValidationPipelineV38,
} from "../src/validation/structured-tool-input-validation-pipeline-v38";

describe("StructuredToolInputValidationPipelineV38", () => {
  it("should pass validation when all fields are correctly provided", async () => {
    const context: ValidationContext = {
      data: {
        toolName: "getWeather",
        parameters: {
          location: "New York",
          unit: "celsius",
        },
      },
      messages: [
        {
          role: "user",
          content: "What's the weather like in New York?",
        },
        {
          role: "assistant",
          content: "I can check the weather for you.",
        },
      ],
    };
    const pipeline = new StructuredToolInputValidationPipelineV38();
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation when required fields are missing", async () => {
    const context: ValidationContext = {
      data: {
        toolName: "getWeather",
        parameters: {},
      },
      messages: [
        {
          role: "user",
          content: "What's the weather like?",
        },
        {
          role: "assistant",
          content: "I can check the weather for you.",
        },
      ],
    };
    const pipeline = new StructuredToolInputValidationPipelineV38();
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: location");
  });

  it("should fail validation when data types are incorrect", async () => {
    const context: ValidationContext = {
      data: {
        toolName: "getWeather",
        parameters: {
          location: 12345, // Should be string
          unit: "celsius",
        },
      },
      messages: [
        {
          role: "user",
          content: "What's the weather like in New York?",
        },
        {
          role: "assistant",
          content: "I can check the weather for you.",
        },
      ],
    };
    const pipeline = new StructuredToolInputValidationPipelineV38();
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for parameter 'location': Expected string, got number");
  });
});