import { describe, it, expect } from "vitest";
import { ToolInputSchemaPipeline } from "../src/validation/tool-input-schema-pipeline";
import { SchemaValidator } from "../src/validation/schema-validator";

describe("ToolInputSchemaPipeline", () => {
  it("should correctly validate input using the injected validator", () => {
    const mockValidator = {
      validate: vi.fn(),
    } as unknown as SchemaValidator;
    const pipeline = new ToolInputSchemaPipeline(mockValidator);
    const mockResult = { isValid: true, errors: [] };
    (mockValidator.validate as jest.Mock).mockReturnValue(mockResult);

    const input = { key: "value" };
    const result = pipeline.validate(input);

    expect(mockValidator.validate).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockResult);
  });

  it("should call validate when run is called", () => {
    const mockValidator = {
      validate: vi.fn(),
    } as unknown as SchemaValidator;
    const pipeline = new ToolInputSchemaPipeline(mockValidator);

    const input = { key: "value" };
    pipeline.run(input);

    expect(mockValidator.validate).toHaveBeenCalledTimes(1);
    expect(mockValidator.validate).toHaveBeenCalledWith(input);
  });

  it("should return the result from the validator when input is invalid", () => {
    const mockValidator = {
      validate: vi.fn(),
    } as unknown as SchemaValidator;
    const pipeline = new ToolInputSchemaPipeline(mockValidator);
    const mockResult = { isValid: false, errors: ["Missing required field"] };
    (mockValidator.validate as jest.Mock).mockReturnValue(mockResult);

    const input = { key: "value" };
    const result = pipeline.run(input);

    expect(result).toEqual(mockResult);
  });
});