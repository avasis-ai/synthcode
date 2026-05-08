import { describe, it, expect, vi } from "vitest";
import { ServiceCallResilienceChain, ResilienceConfig, ServiceCallResult } from "../src/resilience/service-call-resilience-chain";

describe("ServiceCallResilienceChain", () => {
    it("should successfully execute the service call on the first attempt", async () => {
        const mockServiceCall = vi.fn().mockResolvedValue("Success");
        const chain = new ServiceCallResilienceChain(mockServiceCall, {
            maxRetries: 3,
            initialBackoffMs: 10,
            backoffMultiplier: 2,
        });

        const result: ServiceCallResult<string> = await chain.execute();

        expect(mockServiceCall).toHaveBeenCalledTimes(1);
        expect(result.result).toBe("Success");
        expect(result.metrics.attempts).toBe(1);
        expect(result.metrics.success).toBe(true);
    });

    it("should retry the service call with exponential backoff upon failure", async () => {
        const mockServiceCall = vi.fn()
            .mockRejectedValueOnce(new Error("Failure 1"))
            .mockRejectedValueOnce(new Error("Failure 2"))
            .mockResolvedValue("Success");

        const chain = new ServiceCallResilienceChain(mockServiceCall, {
            maxRetries: 2,
            initialBackoffMs: 10,
            backoffMultiplier: 2,
        });

        const result: ServiceCallResult<string> = await chain.execute();

        expect(mockServiceCall).toHaveBeenCalledTimes(3);
        expect(result.result).toBe("Success");
        expect(result.metrics.attempts).toBe(3);
        expect(result.metrics.success).toBe(true);
    });

    it("should fail gracefully after exhausting all retries", async () => {
        const mockServiceCall = vi.fn().mockRejectedValue(new Error("Permanent Failure"));
        const chain = new ServiceCallResilienceChain(mockServiceCall, {
            maxRetries: 2,
            initialBackoffMs: 10,
            backoffMultiplier: 2,
        });

        const result: ServiceCallResult<string> = await chain.execute();

        expect(mockServiceCall).toHaveBeenCalledTimes(3);
        expect(result.result).toBeUndefined();
        expect(result.metrics.attempts).toBe(3);
        expect(result.metrics.success).toBe(false);
        expect(result.metrics.failureReason).toBe("Permanent Failure");
    });
});