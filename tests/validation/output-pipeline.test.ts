import { describe, it, expect } from "vitest";
import { OutputPipeline } from "../src/validation/output-pipeline";

describe("OutputPipeline", () => {
  it("should process input through all steps sequentially", () => {
    const step1: any = {
      execute: (input) => ({ data: input, processedBy1: true }),
    };
    const step2: any = {
      execute: (input) => ({ data: input.data + 1, processedBy2: true }),
    };
    const pipeline = new OutputPipeline([step1, step2]);
    const result = pipeline.process(10);
    expect(result).toEqual({ data: 11, processedBy2: true });
  });

  it("should handle errors in a step and stop processing", () => {
    const step1: any = {
      execute: (input) => ({ data: input, processedBy1: true }),
    };
    const step2: any = {
      execute: (input) => {
        if (input.data > 100) {
          throw new Error("Too large");
        }
        return { data: input.data + 1, processedBy2: true };
      },
    };
    const step3: any = {
      execute: (input) => ({ data: input.data + 100, processedBy3: true }),
    };
    const pipeline = new OutputPipeline([step1, step2, step3]);
    const result = pipeline.process(10);
    expect(result).toEqual({ data: 11, processedBy2: true });
  });

  it("should return the output of the last successful step if an error occurs", () => {
    const step1: any = {
      execute: (input) => ({ data: input, processedBy1: true }),
    };
    const step2: any = {
      execute: (input) => {
        if (input.data > 5) {
          throw new Error("Error in step 2");
        }
        return { data: input.data + 1, processedBy2: true };
      },
    };
    const step3: any = {
      execute: (input) => ({ data: input.data + 100, processedBy3: true }),
    };
    const pipeline = new OutputPipeline([step1, step2, step3]);
    const result = pipeline.process(3);
    expect(result).toEqual({ data: 4, processedBy2: true });
  });
});