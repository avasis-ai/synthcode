import { describe, it, expect } from "vitest";
import { ToolPreconditionChain } from "../src/validation/tool-precondition-chain-builder";
import { Context } from "../src/context";

describe("ToolPreconditionChain", () => {
  it("should return true if all validators pass", () => {
    const mockContext: Context = {
      user: "testUser",
      data: "validData",
    };
    const validator1: any = {
      validate: jest.fn(() => ({ isValid: true })),
    };
    const validator2: any = {
      validate: jest.fn(() => ({ isValid: true })),
    };
    const chain = new ToolPreconditionChain([validator1, validator2]);
    const result = chain.execute(mockContext);
    expect(result.isValid).toBe(true);
    expect(validator1.validate).toHaveBeenCalledWith(mockContext);
    expect(validator2.validate).toHaveBeenCalledWith(mockContext);
  });

  it("should return false and the message of the first failing validator", () => {
    const mockContext: Context = {
      user: "testUser",
      data: "invalidData",
    };
    const validator1: any = {
      validate: jest.fn(() => ({ isValid: true })),
    };
    const validator2: any = {
      validate: jest.fn(() => ({ isValid: false, message: "Invalid data format" })),
    };
    const validator3: any = {
      validate: jest.fn(() => ({ isValid: true })),
    };
    const chain = new ToolPreconditionChain([validator1, validator2, validator3]);
    const result = chain.execute(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.failureMessage).toBe("Invalid data format");
    expect(validator1.validate).toHaveBeenCalledTimes(1);
    expect(validator2.validate).toHaveBeenCalledTimes(1);
    expect(validator3.validate).not.toHaveBeenCalled();
  });

  it("should return true if there are no validators", () => {
    const mockContext: Context = {
      user: "anyUser",
      data: "anyData",
    };
    const chain = new ToolPreconditionChain([]);
    const result = chain.execute(mockContext);
    expect(result.isValid).toBe(true);
  });
});