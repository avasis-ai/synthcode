import { describe, it, expect, vi } from "vitest";
import { RateLimiter } from "../src/rate-limiter";

describe("RateLimiter", () => {
    it("should throw an error for invalid rate or capacity", () => {
        expect(() => new RateLimiter(0, 1)).toThrow("Rate must be positive and capacity non-negative.");
        expect(() => new RateLimiter(1, -1)).toThrow("Rate must be positive and capacity non-negative.");
    });

    it("should allow requests up to the defined rate limit", async () => {
        // Test with a high rate to simulate immediate calls
        const limiter = new RateLimiter(10, 10);
        const calls = [];
        for (let i = 0; i < 10; i++) {
            calls.push(limiter.acquire());
        }
        await Promise.all(calls);
        // If all calls resolve without error, it means they were allowed within the capacity/rate window
    });

    it("should enforce rate limiting by waiting for subsequent requests", async () => {
        // Test with a low rate (e.g., 1 request per second)
        const limiter = new RateLimiter(1, 1);
        const startTime = Date.now();

        // First call should succeed immediately
        await limiter.acquire();

        // Second call should wait approximately 1 second
        const acquisitionPromise = limiter.acquire();
        const secondCallTime = Date.now();

        await acquisitionPromise;
        const endTime = Date.now();

        // Check if the time elapsed is close to the expected rate interval (1000ms)
        // We use a tolerance because of execution overhead.
        expect(endTime - secondCallTime).toBeGreaterThanOrEqual(900);
        expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
});