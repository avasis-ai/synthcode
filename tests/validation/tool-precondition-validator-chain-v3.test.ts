import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV3 } from "../src/validation/tool-precondition-validator-chain-v3";

describe("ToolPreconditionValidatorChainV3", () => {
  it("should pass validation when all validators succeed", async () => {
    const mockValidator1: any = {
      validate: async (context) => {
        if (context.userRole === "admin") {
          throw new Error("Validation failed for admin");
        }
      },
    };
    const mockValidator2: any = {
      validate: async (context) => {
        if (!context.hasPermission) {
          throw new Error("Missing permission");
        }
      },
    };

    const chain = new ToolPreconditionValidatorChainV3<any>();
    chain.addValidator(mockValidator1);
    chain.addValidator(mockValidator2);

    await expect(async () => {
      await chain.validateAll({ userRole: "user", hasPermission: true });
    }).resolves.not.toThrow();
  });

  it("should fail validation immediately upon the first failing validator", async () => {
    const mockValidator1: any = {
      validate: async (context) => {
        if (context.userRole === "admin") {
          throw new Error("Validation failed for admin");
        }
      },
    };
    const mockValidator2: any = {
      validate: async (context) => {
        // This validator should not be called if validator1 fails
        throw new Error("This should never be called");
      },
    };

    const chain = new ToolPreconditionValidatorChainV3<any>();
    chain.addValidator(mockValidator1);
    chain.addValidator(mockValidator2);

    await expect(async () => {
      await chain.validateAll({ userRole: "admin", hasPermission: true });
    }).rejects.toThrow("Validation failed for admin");
  });

  it("should handle an empty chain gracefully", async () => {
    const chain = new ToolPreconditionValidatorChainV3<any>();
    await expect(async () => {
      await chain.validateAll({} as any);
    }).resolves.not.toThrow();
  });
});