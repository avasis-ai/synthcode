import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainBuilder } from "../src/validation/tool-precondition-validator-chain-v5";

describe("ToolPreconditionValidatorChainBuilder", () => {
  it("should build a chain with a single step correctly", async () => {
    const mockStep: any = {
      execute: async (context: any) => ({ result: "ok" }),
    };
    const builder = new ToolPreconditionValidatorChainBuilder<any>();
    const chain = builder.addStep(mockStep).build();

    expect(chain).toBeDefined();
    expect(chain.steps).toHaveLength(1);
    expect(chain.steps[0]).toBe(mockStep);
  });

  it("should build a chain with multiple steps correctly", async () => {
    const mockStep1: any = {
      execute: async (context: any) => ({ result: "ok1" }),
    };
    const mockStep2: any = {
      execute: async (context: any) => ({ result: "ok2" }),
    };
    const builder = new ToolPreconditionValidatorChainBuilder<any>();
    const chain = builder.addStep(mockStep1).addStep(mockStep2).build();

    expect(chain).toBeDefined();
    expect(chain.steps).toHaveLength(2);
    expect(chain.steps[0]).toBe(mockStep1);
    expect(chain.steps[1]).toBe(mockStep2);
  });

  it("should execute all steps sequentially when validating", async () => {
    const mockStep1: any = {
      execute: async (context: any) => ({ step1: true }),
    };
    const mockStep2: any = {
      execute: async (context: any) => ({ step2: true }),
    };
    const initialContext: any = { data: "initial" };
    const builder = new ToolPreconditionValidatorChainBuilder<any>();
    const chain = builder.addStep(mockStep1).addStep(mockStep2).build();

    const result = await chain.validate(initialContext);

    expect(result).toEqual({ step1: true, step2: true });
  });
});