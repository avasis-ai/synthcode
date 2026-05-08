import { describe, it, expect } from "vitest";
import { WeightedAverageStrategy } from "../src/conflict/temporal-conflict-resolver";

describe("WeightedAverageStrategy", () => {
    it("should return a reconciled observation with the weighted average value when multiple observations are provided", () => {
        const strategy = new WeightedAverageStrategy();
        const observations = [
            { value: 10, sourceId: "A", weight: 1 },
            { value: 20, sourceId: "B", weight: 3 },
            { value: 30, sourceId: "C", weight: 2 },
        ];
        const result = strategy.resolve(observations);

        // Expected weighted average: (10*1 + 20*3 + 30*2) / (1 + 3 + 2) = (10 + 60 + 60) / 6 = 130 / 6 ≈ 21.666...
        expect(result.value).toBeCloseTo(21.666666666666668);
        expect(result.source).toBe("WeightedAverageStrategy");
        expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle a single observation correctly", () => {
        const strategy = new WeightedAverageStrategy();
        const observations = [
            { value: 50, sourceId: "D", weight: 1 },
        ];
        const result = strategy.resolve(observations);

        expect(result.value).toBe(50);
        expect(result.source).toBe("WeightedAverageStrategy");
        expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle an empty list of observations by returning a default/zero value", () => {
        const strategy = new WeightedAverageStrategy();
        const observations: any[] = [];
        const result = strategy.resolve(observations);

        expect(result.value).toBe(0);
        expect(result.source).toBe("WeightedAverageStrategy");
        expect(result.timestamp).toBeInstanceOf(Date);
    });
});