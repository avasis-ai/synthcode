import { describe, it, expect } from "vitest";
import { TimeoutManager, TimeoutError } from "../src/tool/timeout-manager";

describe("TimeoutManager", () => {
    it("should throw TimeoutError when the timeout duration is reached", async () => {
        const manager = new TimeoutManager(10);
        const promise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Operation failed")), 50);
        });

        await expect(manager.run(promise)).rejects.toThrow(TimeoutError);
        await expect(manager.run(promise)).rejects.toThrow("Tool call timed out");
    });

    it("should resolve with the result when the operation completes within the timeout", async () => {
        const manager = new TimeoutManager(100);
        const successfulPromise = Promise.resolve("Success data");

        const result = await manager.run(successfulPromise);
        expect(result).toBe("Success data");
    });

    it("should handle promises that never resolve correctly (though it will eventually timeout)", async () => {
        const manager = new TimeoutManager(50);
        const neverResolvingPromise = new Promise(() => {});

        // We expect it to eventually reject with TimeoutError
        await expect(manager.run(neverResolvingPromise)).rejects.toThrow(TimeoutError);
    });
});