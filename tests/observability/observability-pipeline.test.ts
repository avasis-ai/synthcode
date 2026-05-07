import { describe, it, expect, vi } from "vitest";
import { runObservationPipeline } from "../src/observability/observability-pipeline";

describe("Observation Pipeline", () => {
  it("should process a basic observation correctly", async () => {
    const mockObservation = {
      timestamp: Date.now(),
      traceId: "trace123",
      spanId: "span456",
      level: "INFO",
      message: "Operation successful",
      resourceMetrics: {
        cpuUsageMs: 10,
        memoryUsageBytes: 1024,
        diskIOBytes: 50,
      },
      context: {
        component: "ServiceA",
        stepId: "step1",
        metadata: {
          user: "testuser",
        },
      },
      payload: {
        data: "some data",
      },
    };

    const result = await runObservationPipeline(mockObservation);

    expect(result).toBeDefined();
    expect(result).toHaveProperty("processedObservation");
    expect(result.processedObservation.message).toBe("Operation successful");
    expect(result.processedObservation.resourceMetrics.cpuUsageMs).toBe(10);
  });

  it("should handle an observation with error level and complex context", async () => {
    const mockObservation = {
      timestamp: Date.now(),
      traceId: "traceError",
      spanId: "spanError",
      level: "ERROR",
      message: "Database connection failed",
      resourceMetrics: {
        cpuUsageMs: 500,
        memoryUsageBytes: 5 * 1024 * 1024,
        diskIOBytes: 2000,
      },
      context: {
        component: "DatabaseLayer",
        stepId: "db_connect",
        metadata: {
          error_code: 500,
          service: "db",
        },
      },
      payload: {
        errorDetails: "Timeout occurred",
      },
    };

    const result = await runObservationPipeline(mockObservation);

    expect(result).toBeDefined();
    expect(result.processedObservation.level).toBe("ERROR");
    expect(result.processedObservation.context.component).toBe("DatabaseLayer");
    expect(result.processedObservation.payload.errorDetails).toBe("Timeout occurred");
  });

  it("should return a default structure even if metrics are zero", async () => {
    const mockObservation = {
      timestamp: Date.now(),
      traceId: "traceZero",
      spanId: "spanZero",
      level: "DEBUG",
      message: "Background task completed",
      resourceMetrics: {
        cpuUsageMs: 0,
        memoryUsageBytes: 0,
        diskIOBytes: 0,
      },
      context: {
        component: "BackgroundWorker",
        stepId: "cleanup",
        metadata: {},
      },
      payload: null,
    };

    const result = await runObservationPipeline(mockObservation);

    expect(result).toBeDefined();
    expect(result.processedObservation.level).toBe("DEBUG");
    expect(result.processedObservation.resourceMetrics.cpuUsageMs).toBe(0);
    expect(result.processedObservation.context.metadata).toEqual({});
  });
});