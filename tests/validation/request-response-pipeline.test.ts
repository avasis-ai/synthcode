import { describe, it, expect } from "vitest";
import { RequestResponsePipeline } from "../src/validation/request-response-pipeline";

describe("RequestResponsePipeline", () => {
  it("should run all validation steps sequentially and pass the result", async () => {
    const mockStep1: any = {
      validate: async (input) => ({ isValid: true, result: { data: input, step1: true } }),
    };
    const mockStep2: any = {
      validate: async (input) => ({ isValid: true, result: { data: input, step1: true, step2: true } }),
    };

    const pipeline = new RequestResponsePipeline([mockStep1, mockStep2]);
    const result = await pipeline.run({ initial: true });

    expect(result).toEqual({ data: { initial: true, step1: true, step2: true }, step1: true, step2: true });
  });

  it("should stop and return an error if any step fails validation", async () => {
    const mockStep1: any = {
      validate: async (input) => ({ isValid: true, result: { data: input, step1: true } }),
    };
    const mockStep2: any = {
      validate: async (input) => ({ isValid: false, result: null, error: "Validation failed at step 2" }),
    };
    const mockStep3: any = {
      validate: async (input) => ({ isValid: true, result: { data: input, step1: true, step2: true, step3: true } }),
    };

    const pipeline = new RequestResponsePipeline([mockStep1, mockStep2, mockStep3]);
    const result = await pipeline.run({ initial: true });

    expect(result).toEqual({ isValid: false, result: null, error: "Validation failed at step 2" });
  });

  it("should handle an empty pipeline gracefully", async () => {
    const pipeline = new RequestResponsePipeline([]);
    const result = await pipeline.run({ initial: true });

    expect(result).toEqual({ data: { initial: true } });
  });
});