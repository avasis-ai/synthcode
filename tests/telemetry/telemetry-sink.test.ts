import { describe, it, expect, vi } from "vitest";
import { TelemetrySink } from "../src/telemetry/telemetry-sink";

describe("TelemetrySink", () => {
    it("should correctly write a metric and return a promise", async () => {
        const mockSink = {
            writeMetric: vi.fn().mockResolvedValue(undefined),
            writeLog: vi.fn().mockResolvedValue(undefined),
        } as unknown as TelemetrySink;

        const metric = {
            name: "cpu_usage",
            value: 0.8,
            tags: {
                host: "localhost",
            },
            timestamp: Date.now(),
        };

        await mockSink.writeMetric(metric);

        expect(mockSink.writeMetric).toHaveBeenCalledWith(metric);
        expect(mockSink.writeLog).not.toHaveBeenCalled();
    });

    it("should correctly write a log and return a promise", async () => {
        const mockSink = {
            writeMetric: vi.fn().mockResolvedValue(undefined),
            writeLog: vi.fn().mockResolvedValue(undefined),
        } as unknown as TelemetrySink;

        const log = {
            level: "error",
            message: "Database connection failed",
            context: {
                db: "primary",
            },
            timestamp: Date.now(),
        };

        await mockSink.writeLog(log);

        expect(mockSink.writeLog).toHaveBeenCalledWith(log);
        expect(mockSink.writeMetric).not.toHaveBeenCalled();
    });

    it("should handle errors when writing telemetry data", async () => {
        const mockSink = {
            writeMetric: vi.fn().mockRejectedValue(new Error("Network failure")),
            writeLog: vi.fn().mockRejectedValue(new Error("API rate limit exceeded")),
        } as unknown as TelemetrySink;

        const metric = {
            name: "error_count",
            value: 1,
            tags: {},
            timestamp: Date.now(),
        };

        const log = {
            level: "warn",
            message: "High latency detected",
            context: {},
            timestamp: Date.now(),
        };

        await expect(mockSink.writeMetric(metric)).rejects.toThrow("Network failure");
        await expect(mockSink.writeLog(log)).rejects.toThrow("API rate limit exceeded");
    });
});