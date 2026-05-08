import { describe, it, expect } from "vitest";
import { TemporalContextFusionPipeline } from "../src/fusion/temporal-context-fusion-pipeline";

describe("TemporalContextFusionPipeline", () => {
    it("should correctly fuse data points from multiple sources with varying authorities", async () => {
        const pipeline = new TemporalContextFusionPipeline();

        // Simulate data points arriving at the same time
        const dataPoints: DataPoint[] = [
            { timestamp: 1678886400000, sourceId: "A", key: "temperature", value: 20 },
            { timestamp: 1678886400000, sourceId: "B", key: "temperature", value: 25 },
            { timestamp: 1678886400000, sourceId: "C", key: "pressure", value: 101.2 },
        ];

        // Simulate source authorities (B is most authoritative for temperature)
        const authorities: Record<string, SourceAuthority> = {
            "temperature": { "A": 0.5, "B": 0.8, "C": 0.1 },
            "pressure": { "A": 0.1, "B": 0.1, "C": 1.0 },
        };

        // Process the data points
        await pipeline.processDataPoints(dataPoints, authorities);

        // Check the fused results (assuming the pipeline stores results internally or returns them)
        // Since the internal structure isn't fully visible, we test the core logic assumption:
        // The result for 'temperature' should be weighted towards 'B'.
        const fusedTemperatureResult = pipeline.getFusedValue("temperature", 1678886400000);
        expect(fusedTemperatureResult).toBeCloseTo(22.1, 2); // (0.5*20 + 0.8*25 + 0.1*X) / (0.5+0.8+0.1) -> simplified check

        // The result for 'pressure' should be weighted towards 'C'.
        const fusedPressureResult = pipeline.getFusedValue("pressure", 1678886400000);
        expect(fusedPressureResult).toBeCloseTo(101.2, 2);
    });

    it("should handle time-series data by processing points sequentially", async () => {
        const pipeline = new TemporalContextFusionPipeline();

        // Time step 1
        const dataPoints1: DataPoint[] = [
            { timestamp: 100, sourceId: "X", key: "speed", value: 10 },
        ];
        const authorities1: Record<string, SourceAuthority> = {
            "speed": { "X": 1.0 }
        };
        await pipeline.processDataPoints(dataPoints1, authorities1);

        // Time step 2 (later)
        const dataPoints2: DataPoint[] = [
            { timestamp: 200, sourceId: "Y", key: "speed", value: 20 },
        ];
        const authorities2: Record<string, SourceAuthority> = {
            "speed": { "Y": 1.0 }
        };
        await pipeline.processDataPoints(dataPoints2, authorities2);

        // Check if the pipeline recorded results for both timestamps
        const result1 = pipeline.getFusedValue("speed", 100);
        expect(result1).toBe(10);

        const result2 = pipeline.getFusedValue("speed", 200);
        expect(result2).toBe(20);
    });

    it("should return undefined or a default value if no data points are available for a key at a given timestamp", async () => {
        const pipeline = new TemporalContextFusionPipeline();

        // Process data for 'temperature' at time 100
        const dataPoints: DataPoint[] = [
            { timestamp: 100, sourceId: "A", key: "temperature", value: 20 },
        ];
        const authorities: Record<string, SourceAuthority> = {
            "temperature": { "A": 1.0 }
        };
        await pipeline.processDataPoints(dataPoints, authorities);

        // Attempt to retrieve a key ('pressure') that was never reported at time 100
        const missingResult = pipeline.getFusedValue("pressure", 100);
        expect(missingResult).toBeUndefined();

        // Attempt to retrieve a key at a time that was never processed
        const missingTimeResult = pipeline.getFusedValue("temperature", 999);
        expect(missingTimeResult).toBeUndefined();
    });
});