import { describe, it, expect } from "vitest";
import { ConstraintPipeline, Context, Message } from "../src/validation/contextual-constraint-validation-pipeline";

describe("ConstraintPipeline", () => {
  it("should initialize correctly with an empty pipeline", () => {
    const pipeline = new ConstraintPipeline();
    expect(pipeline).toBeInstanceOf(ConstraintPipeline);
  });

  it("should process context through multiple validators sequentially", async () => {
    const mockValidator1 = {
      validate: jest.fn((context: Context) => ({
        result: { isValid: true, errors: [] },
        newContext: { ...context, data: { ...context.data, processedBy1: true } },
      })),
    };
    const mockValidator2 = {
      validate: jest.fn((context: Context) => ({
        result: { isValid: true, errors: [] },
        newContext: { ...context, data: { ...context.data, processedBy2: true } },
      })),
    };

    const pipeline = new ConstraintPipeline([mockValidator1, mockValidator2]);
    const initialContext: Context = { data: { initial: true }, history: [] };

    const finalContext = await pipeline.process(initialContext);

    expect(mockValidator1.validate).toHaveBeenCalledWith(initialContext);
    expect(mockValidator2.validate).toHaveBeenCalledWith({
      data: { initial: true, processedBy1: true },
      history: [],
    });
    expect(finalContext.data).toEqual({ initial: true, processedBy1: true, processedBy2: true });
  });

  it("should stop processing and return invalid result if any validator fails", async () => {
    const mockValidator1 = {
      validate: jest.fn((context: Context) => ({
        result: { isValid: true, errors: [] },
        newContext: { ...context, data: { ...context.data, processedBy1: true } },
      })),
    };
    const mockValidator2 = {
      validate: jest.fn((context: Context) => ({
        result: { isValid: false, errors: ["Validation failed at step 2"] },
        newContext: { ...context, data: { ...context.data, processedBy2: true } },
      })),
    };
    const mockValidator3 = {
      validate: jest.fn((context: Context) => ({
        result: { isValid: true, errors: [] },
        newContext: { ...context, data: { ...context.data, processedBy3: true } },
      })),
    };

    const pipeline = new ConstraintPipeline([mockValidator1, mockValidator2, mockValidator3]);
    const initialContext: Context = { data: { initial: true }, history: [] };

    const finalContext = await pipeline.process(initialContext);

    expect(mockValidator1.validate).toHaveBeenCalledTimes(1);
    expect(mockValidator2.validate).toHaveBeenCalledTimes(1);
    expect(mockValidator3.validate).not.toHaveBeenCalled();
    expect(finalContext.data).toEqual({ initial: true, processedBy1: true, processedBy2: true });
  });
});