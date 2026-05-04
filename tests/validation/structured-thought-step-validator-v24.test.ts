import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV24 } from "../src/validation/structured-thought-step-validator-v24";
import { Message } from "../src/types/message";

describe("StructuredThoughtStepValidatorV24", () => {
  it("should return true when both step type and context validation pass", () => {
    const mockStepTypeValidator = jest.fn(() => true);
    const mockContextValidator = jest.fn(() => true);
    const validator = new StructuredThoughtStepValidatorV24(mockStepTypeValidator, mockContextValidator);
    const message: Message = { role: "user", content: "test" };
    const context = { history: [message] };

    const result = validator.validate(message, context);

    expect(result).toBe(true);
    expect(mockStepTypeValidator).toHaveBeenCalledWith(message);
    expect(mockContextValidator).toHaveBeenCalledWith(context);
  });

  it("should return false if the step type validation fails", () => {
    const mockStepTypeValidator = jest.fn(() => false);
    const mockContextValidator = jest.fn(() => true);
    const validator = new StructuredThoughtStepValidatorV24(mockStepTypeValidator, mockContextValidator);
    const message: Message = { role: "user", content: "test" };
    const context = { history: [message] };

    const result = validator.validate(message, context);

    expect(result).toBe(false);
    expect(mockStepTypeValidator).toHaveBeenCalledWith(message);
    expect(mockContextValidator).not.toHaveBeenCalled();
  });

  it("should return false if the context validation fails", () => {
    const mockStepTypeValidator = jest.fn(() => true);
    const mockContextValidator = jest.fn(() => false);
    const validator = new StructuredThoughtStepValidatorV24(mockStepTypeValidator, mockContextValidator);
    const message: Message = { role: "user", content: "test" };
    const context = { history: [message] };

    const result = validator.validate(message, context);

    expect(result).toBe(false);
    expect(mockStepTypeValidator).toHaveBeenCalledWith(message);
    expect(mockContextValidator).toHaveBeenCalledWith(context);
  });
});