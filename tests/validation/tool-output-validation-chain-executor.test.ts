import { describe, it, expect } from "vitest";
import { ToolOutputValidationChainExecutor, ToolOutputValidator } from "../src/validation/tool-output-validation-chain-executor";

describe("ToolOutputValidationChainExecutor", () => {
  it("should return valid result if all validators pass", () => {
    const validator1: ToolOutputValidator = (output) => {
      if (typeof output === "string" && output.length > 0) {
        return { isValid: true, message: "Valid 1" };
      }
      return { isValid: false, message: "Invalid 1" };
    };
    const validator2: ToolOutputValidator = (output) => {
      if (typeof output === "string" && output.includes("success")) {
        return { isValid: true, message: "Valid 2" };
      }
      return { isValid: false, message: "Invalid 2" };
    };

    const executor = new ToolOutputValidationChainExecutor([validator1, validator2]);
    const result = executor.execute("Some successful output");

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("Valid 2"); // Should return the message from the last successful validator
  });

  it("should return the failure result from the first failing validator", () => {
    const validator1: ToolOutputValidator = (output) => {
      if (typeof output === "string" && output.length > 0) {
        return { isValid: true, message: "Valid 1" };
      }
      return { isValid: false, message: "Invalid 1" };
    };
    const validator2: ToolOutputValidator = (output) => {
      if (typeof output === "string" && output.includes("success")) {
        return { isValid: true, message: "Valid 2" };
      }
      return { isValid: false, message: "Invalid 2" };
    };

    const executor = new ToolOutputValidationChainExecutor([validator2, validator1]);
    const result = executor.execute("No success here");

    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Invalid 2"); // Should return the message from the first failing validator
  });

  it("should return the initial failure result if all validators fail", () => {
    const validator1: ToolOutputValidator = (output) => {
      return { isValid: false, message: "Fail 1" };
    };
    const validator2: ToolOutputValidator = (output) => {
      return { isValid: false, message: "Fail 2" };
    };

    const executor = new ToolOutputValidationChainExecutor([validator1, validator2]);
    const result = executor.execute("Any output");

    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Fail 2"); // Should return the message from the last validator executed (even if it failed)
  });
});