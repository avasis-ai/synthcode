import { describe, it, expect, vi } from "vitest";
import { RateLimitingCoordinator } from "../src/rate-limiting/rate-limiting-coordinator.js";

describe("RateLimitingCoordinator", () => {
    it("should initialize correctly with provided dimensions", () => {
        const mockLimiter1 = { tryAcquire: vi.fn() };
        const mockCostCalculator1 = vi.fn(() => 1);
        const mockDimension1: any = {
            name: "dimension1",
            limiter: mockLimiter1,
            costCalculator: mockCostCalculator1,
        };

        const mockLimiter2 = { tryAcquire: vi.fn() };
        const mockCostCalculator2 = vi.fn(() => 2);
        const mockDimension2: any = {
            name: "dimension2",
            limiter: mockLimiter2,
            costCalculator: mockCostCalculator2,
        };

        const coordinator = new RateLimitingCoordinator([mockDimension1, mockDimension2]);

        expect(coordinator).toBeInstanceOf(RateLimitingCoordinator);
        expect(coordinator.dimensions.length).toBe(2);
    });

    it("should attempt to acquire tokens from all dimensions and return success if any succeed", async () => {
        const mockLimiter1 = { tryAcquire: vi.fn().mockReturnValue(false) };
        const mockCostCalculator1 = vi.fn(() => 1);
        const mockDimension1: any = {
            name: "dimension1",
            limiter: mockLimiter1,
            costCalculator: mockCostCalculator1,
        };

        const mockLimiter2 = { tryAcquire: vi.fn().mockReturnValue(true) };
        const mockCostCalculator2 = vi.fn(() => 2);
        const mockDimension2: any = {
            name: "dimension2",
            limiter: mockLimiter2,
            costCalculator: mockCostCalculator2,
        };

        const coordinator = new RateLimitingCoordinator([mockDimension1, mockDimension2]);
        const context = {};

        const result = await coordinator.tryAcquire(context);

        expect(mockLimiter1.tryAcquire).toHaveBeenCalledWith(context, 1);
        expect(mockLimiter2.tryAcquire).toHaveBeenCalledWith(context, 2);
        expect(result).toEqual({ success: true, acquiredDimensions: ["dimension2"] });
    });

    it("should return failure if all dimensions fail to acquire tokens", async () => {
        const mockLimiter1 = { tryAcquire: vi.fn().mockReturnValue(false) };
        const mockCostCalculator1 = vi.fn(() => 1);
        const mockDimension1: any = {
            name: "dimension1",
            limiter: mockLimiter1,
            costCalculator: mockCostCalculator1,
        };

        const mockLimiter2 = { tryAcquire: vi.fn().mockReturnValue(false) };
        const mockCostCalculator2 = vi.fn(() => 2);
        const mockDimension2: any = {
            name: "dimension2",
            limiter: mockLimiter2,
            costCalculator: mockCostCalculator2,
        };

        const coordinator = new RateLimitingCoordinator([mockDimension1, mockDimension2]);
        const context = {};

        const result = await coordinator.tryAcquire(context);

        expect(mockLimiter1.tryAcquire).toHaveBeenCalledWith(context, 1);
        expect(mockLimiter2.tryAcquire).toHaveBeenCalledWith(context, 2);
        expect(result).toEqual({ success: false, acquiredDimensions: [] });
    });
});