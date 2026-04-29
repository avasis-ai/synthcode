import { describe, it, expect } from "vitest";
import { ValidationChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder-v115";

describe("ValidationChainBuilder", () => {
  it("should build a chain with a single validator correctly", () => {
    const mockValidator = {
      validate: (input: any) => ({ isValid: true, errors: [] }),
    };
    const builder = new ValidationChainBuilder<any>();
    const chain = builder.addValidator({ validator: mockValidator, name: "singleValidator" });

    expect(typeof chain.execute).toBe("function");
    const result = chain.execute({ data: "test" });
    expect(result.errors).toEqual([]);
    expect(result.result).toBeDefined();
  });

  it("should build a chain with multiple validators and execute them sequentially", () => {
    const mockValidator1 = {
      validate: (input: any) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2 = {
      validate: (input: any) => ({ isValid: true, errors: [] }),
    };
    const builder = new ValidationChainBuilder<any>();
    const chain = builder
      .addValidator({ validator: mockValidator1, name: "validator1" })
      .addValidator({ validator: mockValidator2, name: "validator2" });

    expect(typeof chain.execute).toBe("function");
    const result = chain.execute({ data: "test" });
    expect(result.errors).toEqual([]);
    expect(result.result).toBeDefined();
  });

  it("should handle validation failures across multiple steps", () => {
    const mockValidator1 = {
      validate: (input: any) => ({ isValid: false, errors: ["Error 1"] }),
    };
    const mockValidator2 = {
      validate: (input: any) => ({ isValid: false, errors: ["Error 2"] }),
    };
    const builder = new ValidationChainBuilder<any>();
    const chain = builder
      .addValidator({ validator: mockValidator1, name: "validator1" })
      .addValidator({ validator: mockValidator2, name: "validator2" });

    // Assuming the execution stops or aggregates errors on failure
    const result = chain.execute({ data: "invalid" });
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
    expect(result.result).toBeNull();
  });
});