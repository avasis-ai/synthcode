import { describe, it, expect } from "vitest";
import { ResourceConstrainedExecutor } from "../src/resource/constrained-executor";

describe("ResourceConstrainedExecutor", () => {
    it("should execute a function successfully when constraints are met", async () => {
        const executor = new ResourceConstrainedExecutor();
        const mockFunction = async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return "Success";
        };

        const result = await executor.execute(mockFunction, { timeoutMs: 100 });

        expect(result.success).toBe(true);
        expect(result.result).toBe("Success");
        expect(result.error).toBeNull();
        expect(result.resourceUsageReport.timeElapsedMs).toBeGreaterThanOrEqual(10);
    });

    it("should fail with timeout error if execution exceeds timeoutMs", async () => {
        const executor = new ResourceConstrainedExecutor();
        const mockFunction = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return "Should not reach";
        };

        const result = await executor.execute(mockFunction, { timeoutMs: 50 });

        expect(result.success).toBe(false);
        expect(result.result).toBeNull();
        expect(result.error).toContain("Timeout");
        expect(result.resourceUsageReport.timeElapsedMs).toBeCloseTo(50, 50); // Check if it timed out close to the limit
    });

    it("should handle execution errors thrown by the function", async () => {
        const executor = new ResourceConstrainedExecutor();
        const mockFunction = async () => {
            throw new Error("Execution failed intentionally");
        };

        const result = await executor.execute(mockFunction, { timeoutMs: 100 });

        expect(result.success).toBe(false);
        expect(result.result).toBeNull();
        expect(result.error).toContain("Execution failed intentionally");
        expect(result.resourceUsageReport.timeElapsedMs).toBeGreaterThanOrEqual(0);
    });
});