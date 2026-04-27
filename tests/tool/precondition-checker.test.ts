import { describe, it, expect } from "vitest";
import { PreconditionChecker } from "../src/tool/precondition-checker";

describe("PreconditionChecker", () => {
  it("should pass all preconditions when all return true", async () => {
    const mockPreconditions: { name: string; check: Precondition }[] = [
      { name: "precondition1", check: async (context) => true },
      { name: "precondition2", check: async (context) => true },
    ];
    const checker = new PreconditionChecker(mockPreconditions);
    await expect(checker.checkAll(mockPreconditions.map(p => p.name))).resolves.toEqual([]);
  });

  it("should stop and return the first failure encountered", async () => {
    const mockPreconditions: { name: string; check: Precondition }[] = [
      { name: "precondition1", check: async (context) => true },
      { name: "precondition2", check: async (context) => new Error("Failure in P2") },
      { name: "precondition3", check: async (context) => true },
    ];
    const checker = new PreconditionChecker(mockPreconditions);
    const failures = await checker.checkAll(mockPreconditions.map(p => p.name));
    expect(failures).toHaveLength(1);
    expect(failures[0].preconditionName).toBe("precondition2");
    expect(failures[0].error.message).toBe("Failure in P2");
  });

  it("should return an empty array if no preconditions are provided", async () => {
    const checker = new PreconditionChecker([]);
    await expect(checker.checkAll([])).resolves.toEqual([]);
  });
});