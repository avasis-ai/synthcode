import { describe, it, expect } from "vitest";
import { ContextualConstraintValidatorChain } from "../src/validation/contextual-constraint-validator-chain";
import { Context } from "../src/context";

describe("ContextualConstraintValidatorChain", () => {
  it("should initialize correctly with no validators", () => {
    const chain = ContextualConstraintValidatorChain.create([]);
    // Assuming there's a way to check internal state or a getter, 
    // for this test, we'll just check if instantiation succeeds.
    expect(chain).toBeDefined();
  });

  it("should execute all provided validators and aggregate results", () => {
    const mockContext: Context = { userId: 1, role: "admin" };
    const mockPayload = { name: "Test" };

    const validator1 = {
      validate: (context: Context, payload: any): { isValid: boolean; errors: string[] } => {
        if (context.role === "admin") {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: ["Role mismatch"] };
      },
    };
    const validator2 = {
      validate: (context: Context, payload: any): { isValid: boolean; errors: string[] } => {
        if (payload.name === "Test") {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: ["Name invalid"] };
      },
    };

    const chain = ContextualConstraintValidatorChain.create([validator1, validator2]);
    const result = chain.validate(mockContext, mockPayload);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return false and aggregate errors if any validator fails", () => {
    const mockContext: Context = { userId: 1, role: "guest" };
    const mockPayload = { name: "Bad" };

    const validator1 = {
      validate: (context: Context, payload: any): { isValid: boolean; errors: string[] } => {
        return { isValid: false, errors: ["Context error"] };
      },
    };
    const validator2 = {
      validate: (context: Context, payload: any): { isValid: boolean; errors: string[] } => {
        return { isValid: false, errors: ["Payload error"] };
      },
    };

    const chain = ContextualConstraintValidatorChain.create([validator1, validator2]);
    const result = chain.validate(mockContext, mockPayload);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Context error", "Payload error"]);
  });
});