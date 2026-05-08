import { describe, it, expect, vi } from "vitest";
import { ExternalServiceChoreographer, ServiceInteraction } from "../src/choreography/external-service-choreographer";

describe("ExternalServiceChoreographer", () => {
  it("should successfully poll until the success criteria is met", async () => {
    const mockServiceInteraction: ServiceInteraction = {
      id: "test-service",
      endpoint: "/status",
      pollingIntervalMs: 10,
      maxAttempts: 5,
      successCriteria: (data) => data.status === "SUCCESS",
      fetchStatus: vi.fn()
        .mockResolvedValueOnce({ status: "PENDING", details: "Attempt 1" })
        .mockResolvedValueOnce({ status: "PENDING", details: "Attempt 2" })
        .mockResolvedValueOnce({ status: "SUCCESS", data: { result: "ok" } }),
    };

    const choreographer = new ExternalServiceChoreographer();
    const result = await choreographer.pollService(mockServiceInteraction);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ result: "ok" });
    expect(mockServiceInteraction.fetchStatus).toHaveBeenCalledTimes(3);
  });

  it("should stop polling and fail if max attempts are exceeded", async () => {
    const mockServiceInteraction: ServiceInteraction = {
      id: "test-service",
      endpoint: "/status",
      pollingIntervalMs: 10,
      maxAttempts: 3,
      successCriteria: (data) => data.status === "SUCCESS",
      fetchStatus: vi.fn()
        .mockResolvedValue({ status: "PENDING", details: "Attempt 1" })
        .mockResolvedValue({ status: "PENDING", details: "Attempt 2" })
        .mockResolvedValue({ status: "PENDING", details: "Attempt 3" }),
    };

    const choreographer = new ExternalServiceChoreographer();
    const result = await choreographer.pollService(mockServiceInteraction);

    expect(result.success).toBe(false);
    expect(result.data).toEqual({});
    expect(mockServiceInteraction.fetchStatus).toHaveBeenCalledTimes(3);
  });

  it("should handle immediate success on the first attempt", async () => {
    const mockServiceInteraction: ServiceInteraction = {
      id: "test-service",
      endpoint: "/status",
      pollingIntervalMs: 10,
      maxAttempts: 5,
      successCriteria: (data) => data.status === "SUCCESS",
      fetchStatus: vi.fn().mockResolvedValue({ status: "SUCCESS", data: { result: "ok" } }),
    };

    const choreographer = new ExternalServiceChoreographer();
    const result = await choreographer.pollService(mockServiceInteraction);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ result: "ok" });
    expect(mockServiceInteraction.fetchStatus).toHaveBeenCalledTimes(1);
  });
});