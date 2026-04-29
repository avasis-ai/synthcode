import { describe, it, expect } from "vitest";
import { AdvancedValidationBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v125-advanced";

describe("AdvancedValidationBuilder", () => {
  it("should initialize with no steps and validators", () => {
    const builder = new AdvancedValidationBuilder();
    expect(builder["steps"]).toEqual([]);
    expect(builder["advancedValidators"]).toEqual([]);
  });

  it("should add a basic validation step correctly", () => {
    const builder = new AdvancedValidationBuilder();
    const mockStep: any = (context: Map<string, any>, input: any) => ({ result: "ok", contextUpdate: { status: "processed" } });
    builder.addStep(mockStep);
    expect(builder["steps"]).toHaveLength(1);
    expect(builder["steps"][0]).toBe(mockStep);
  });

  it("should execute all added steps and validators sequentially", async () => {
    const builder = new AdvancedValidationBuilder();
    const initialContext = new Map([["user_id", "123"]]);
    const mockInput = { data: "test" };
    const contextUpdate1 = { processed_data: "step1_result" };
    const contextUpdate2 = { final_status: "success" };

    const mockStep1: any = (context: Map<string, any>, input: any) => ({ result: "step1_result", contextUpdate: contextUpdate1 });
    const mockStep2: any = (context: Map<string, any>, input: any) => ({ result: "step2_result", contextUpdate: contextUpdate2 });
    const mockValidator: any = (context: Map<string, any>, input: any) => ({ result: "validator_ok", contextUpdate: { validated: true } });

    builder.addStep(mockStep1);
    builder.addStep(mockStep2);
    builder.addAdvancedValidator(mockValidator);

    const result = await builder.execute(initialContext, mockInput);

    expect(result.result).toBe("validator_ok");
    expect(result.contextUpdate).toEqual({
      processed_data: "step1_result",
      final_status: "success",
      validated: true,
    });
  });
});