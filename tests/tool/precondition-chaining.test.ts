import { describe, it, expect } from "vitest";
import { PreconditionChain } from "../src/tool/precondition-chaining";

describe("PreconditionChain", () => {
  it("should return failure immediately if the first checker fails", () => {
    const failingChecker: PreconditionChecker = {
      check: (context) => ({ success: false, reason: "First check failed" }),
    };
    const passingChecker: PreconditionChecker = {
      check: (context) => ({ success: true }),
    };
    const chain = new PreconditionChain([failingChecker, passingChecker]);
    const result = chain.checkAll({});
    expect(result).toEqual({ success: false, reason: "First check failed" });
  });

  it("should return failure with the reason from the first failing checker", () => {
    const checker1: PreconditionChecker = {
      check: (context) => ({ success: false, reason: "Missing required key A" }),
    };
    const checker2: PreconditionChecker = {
      check: (context) => ({ success: false, reason: "Missing required key B" }),
    };
    const chain = new PreconditionChain([checker1, checker2]);
    const result = chain.checkAll({});
    expect(result).toEqual({ success: false, reason: "Missing required key A" });
  });

  it("should return success if all checkers pass", () => {
    const passingChecker1: PreconditionChecker = {
      check: (context) => ({ success: true }),
    };
    const passingChecker2: PreconditionChecker = {
      check: (context) => ({ success: true }),
    };
    const chain = new PreconditionChain([passingChecker1, passingChecker2]);
    const result = chain.checkAll({ some: "context" });
    expect(result).toEqual({ success: true });
  });
});