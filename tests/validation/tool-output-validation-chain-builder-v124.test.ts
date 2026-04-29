import { describe, it, expect } from "vitest";
import { ToolOutputValidationChainBuilder } from "../src/validation/tool-output-validation-chain-builder-v124";

describe("ToolOutputValidationChainBuilder", () => {
  it("should build a chain with a single validation step", () => {
    const builder = new ToolOutputValidationChainBuilder();
    const step = (input: any) => ({ isValid: true, output: input, errors: [] });
    const chain = builder.addStep(step).build();

    expect(chain).toBeInstanceOf(Array);
    expect(chain.length).toBe(1);
  });

  it("should build a chain with multiple validation steps", () => {
    const builder = new ToolOutputValidationChainBuilder();
    const step1 = (input: any) => ({ isValid: true, output: input, errors: [] });
    const step2 = (input: any) => ({ isValid: true, output: input, errors: [] });
    const chain = builder.addStep(step1).addStep(step2).build();

    expect(chain).toBeInstanceOf(Array);
    expect(chain.length).toBe(2);
  });

  it("should correctly process the output through the entire validation chain", () => {
    const builder = new ToolOutputValidationChainBuilder();
    let initialInput = { data: "test" };
    let stepCount = 0;

    const step1 = (input: any) => {
      stepCount++;
      return { isValid: true, output: { ...input, processedBy1: true }, errors: [] };
    };
    const step2 = (input: any) => {
      stepCount++;
      return { isValid: true, output: { ...input, processedBy2: true }, errors: [] };
    };

    const chain = builder.addStep(step1).addStep(step2).build();
    const result = chain.execute(initialInput);

    expect(stepCount).toBe(2);
    expect(result.isValid).toBe(true);
    expect(result.output).toEqual({ data: "test", processedBy1: true, processedBy2: true });
  });
});