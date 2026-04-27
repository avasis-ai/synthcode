import { describe, it, expect } from "vitest";
import { PreconditionChain, PreconditionValidator } from "../src/validation/precondition-chain";

describe("PreconditionChain", () => {
  it("should return the result of the first validator if it fails", async () => {
    const mockValidator1: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: false,
        contextUpdates: {},
        error: "Error in validator 1",
      }),
    };
    const mockValidator2: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: true,
        contextUpdates: {
          someKey: "value",
        },
      }),
    };

    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = await chain.validate({});

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Error in validator 1");
  });

  it("should pass context updates from all successful validators", async () => {
    const mockValidator1: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: true,
        contextUpdates: {
          user: "Alice",
        },
      }),
    };
    const mockValidator2: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: true,
        contextUpdates: {
          role: "admin",
        },
      }),
    };

    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = await chain.validate({});

    expect(result.isValid).toBe(true);
    expect(result.contextUpdates).toEqual({
      user: "Alice",
      role: "admin",
    });
  });

  it("should return the context updates from the last successful validator if all pass", async () => {
    const mockValidator1: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: true,
        contextUpdates: {
          a: 1,
        },
      }),
    };
    const mockValidator2: PreconditionValidator = {
      validate: async (context: any) => ({
        isValid: true,
        contextUpdates: {
          b: 2,
        },
      }),
    };

    const chain = new PreconditionChain([mockValidator1, mockValidator2]);
    const result = await chain.validate({});

    expect(result.isValid).toBe(true);
    // The implementation should merge updates, so we check for both.
    expect(result.contextUpdates).toEqual({
      a: 1,
      b: 2,
    });
  });
});