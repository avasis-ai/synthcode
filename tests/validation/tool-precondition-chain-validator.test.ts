import { describe, it, expect } from "vitest";
import { PreconditionChain } from "../src/validation/tool-precondition-chain-validator";

describe("PreconditionChain", () => {
  it("should return valid when all validators pass", () => {
    const mockValidator1: any = {
      validate: jest.fn(() => ({ isValid: true, errors: [] })),
    };
    const mockValidator2: any = {
      validate: jest.fn(() => ({ isValid: true, errors: [] })),
    };
    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = chain.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors when any validator fails", () => {
    const mockValidator1: any = {
      validate: jest.fn(() => ({ isValid: false, errors: ["Error 1"] })),
    };
    const mockValidator2: any = {
      validate: jest.fn(() => ({ isValid: false, errors: ["Error 2"] })),
    };
    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = chain.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
  });

  it("should return correct result when only one validator fails", () => {
    const mockValidator1: any = {
      validate: jest.fn(() => ({ isValid: true, errors: [] })),
    };
    const mockValidator2: any = {
      validate: jest.fn(() => ({ isValid: false, errors: ["Single Error"] })),
    };
    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = chain.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Single Error"]);
  });
});