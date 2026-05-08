import { describe, it, expect, vi } from "vitest";
import { ActionResilienceChain } from "../src/resilience/action-resilience-chain";

describe("ActionResilienceChain", () => {
  it("should execute the primary action successfully", async () => {
    const mockPrimaryAction = vi.fn(async (context) => {
      expect(context).toBeDefined();
      return "Success";
    });

    const chain = new ActionResilienceChain<string>(mockPrimaryAction);
    const result = await chain.execute({});
    expect(result).toBe("Success");
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it("should retry the action with exponential backoff upon failure", async () => {
    const mockPrimaryAction = vi.fn()
      .mockRejectedValueOnce(new Error("Failure 1"))
      .mockRejectedValueOnce(new Error("Failure 2"))
      .mockResolvedValue("Success");

    const chain = new ActionResilienceChain<string>(mockPrimaryAction);
    await chain.execute({});

    expect(mockPrimaryAction).toHaveBeenCalledTimes(3);
  });

  it("should throw an error if all retry attempts fail", async () => {
    const mockPrimaryAction = vi.fn().mockRejectedValue(new Error("Permanent Failure"));

    const chain = new ActionResilienceChain<string>(mockPrimaryAction);
    await expect(chain.execute({})).rejects.toThrow("Permanent Failure");
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
  });
});