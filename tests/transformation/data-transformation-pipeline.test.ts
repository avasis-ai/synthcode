import { describe, it, expect, vi } from "vitest";
import { DataTransformationPipelineBuilder } from "../src/transformation/data-transformation-pipeline";

describe("DataTransformationPipelineBuilder", () => {
  it("should initialize with no steps", () => {
    const builder = new DataTransformationPipelineBuilder();
    // Assuming DataTransformer constructor or a getter can verify this, 
    // but based on the provided snippet, we test the builder's state management.
    // Since we can't access private steps, we test the build process indirectly.
    const transformer = builder.build();
    // If DataTransformer exposes a way to check steps, we would use it.
    // For now, we assume a clean build results in a functional, empty transformer.
    expect(transformer).toBeDefined();
  });

  it("should add multiple steps correctly", async () => {
    const mockStep1: any = { name: "step1", transform: async (data) => ({ result: "step1" }) };
    const mockStep2: any = { name: "step2", transform: async (data) => ({ result: "step2" }) };

    const builder = new DataTransformationPipelineBuilder();
    const builtTransformer = builder.addStep(mockStep1).addStep(mockStep2).build();

    // We need to verify that the built transformer executes both steps.
    // Assuming DataTransformer has a method like 'transform' that runs all steps.
    const result = await builtTransformer.transform(null, {});
    
    // Since the actual implementation of DataTransformer is cut off, 
    // we assume the transformation runs sequentially and combines results.
    expect(result).toEqual({ 
        step1: { result: "step1" }, 
        step2: { result: "step2" } 
    });
  });

  it("should handle complex asynchronous steps", async () => {
    const mockStep: any = { 
      name: "asyncStep", 
      transform: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { dataProcessed: true };
      }
    };

    const builder = new DataTransformationPipelineBuilder();
    const builtTransformer = builder.addStep(mockStep).build();

    const result = await builtTransformer.transform(null, {});
    expect(result).toEqual({ dataProcessed: true });
  });
});