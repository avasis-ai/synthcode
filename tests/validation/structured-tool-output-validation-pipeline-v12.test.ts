import { describe, it, expect } from "vitest";
import { ValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v12";

describe("ValidationPipeline", () => {
  it("should initialize correctly", () => {
    const pipeline = new ValidationPipeline();
    expect(typeof pipeline.run).toBe("function");
    expect(typeof pipeline.addValidator).toBe("function");
  });

  it("should run with no validators and return valid", () => {
    const pipeline = new ValidationPipeline();
    const output = { tool_calls: [] };
    const result = pipeline.run(output);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should accumulate errors from multiple validators", () => {
    const mockValidator1 = {
      validate: jest.fn().mockReturnValue({ isValid: false, errors: ["Error 1"] }),
    };
    const mockValidator2 = {
      validate: jest.fn().mockReturnValue({ isValid: false, errors: ["Error 2"] }),
    };
    const pipeline = new ValidationPipeline();
    (pipeline as any).addValidator(mockValidator1);
    (pipeline as any).addValidator(mockValidator2);

    const output = { tool_calls: [] };
    const result = pipeline.run(output);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
  });
});