import { describe, it, expect, vi } from "vitest";
import { ServiceCallGraphExecutor } from "../../../src/orchestration/service-call-graph-executor";

describe("ServiceCallGraphExecutor", () => {
  it("should execute a simple sequence of service calls successfully", async () => {
    const executor = new ServiceCallGraphExecutor();
    const mockService1 = vi.fn().mockResolvedValue("Result 1");
    const mockService2 = vi.fn().mockResolvedValue("Result 2");

    const serviceCalls = [
      { name: "service1", function: mockService1 },
      { name: "service2", function: mockService2 },
    ];

    const result = await executor.execute(serviceCalls, {});
    expect(mockService1).toHaveBeenCalledTimes(1);
    expect(mockService2).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      "Result 1",
      "Result 2",
    ]);
  });

  it("should handle service calls that fail and propagate the error", async () => {
    const executor = new ServiceCallGraphExecutor();
    const mockService1 = vi.fn().mockResolvedValue("Success");
    const mockService2 = vi.fn().mockRejectedValue(new Error("Service 2 Failed"));

    const serviceCalls = [
      { name: "service1", function: mockService1 },
      { name: "service2", function: mockService2 },
    ];

    await expect(async () => {
      await executor.execute(serviceCalls, {});
    }).rejects.toThrow("Service 2 Failed");

    expect(mockService1).toHaveBeenCalledTimes(1);
    expect(mockService2).toHaveBeenCalledTimes(1);
  });

  it("should pass context results from previous calls to subsequent calls", async () => {
    const executor = new ServiceCallGraphExecutor();
    const mockService1 = vi.fn().mockResolvedValue({ data: "Context for Service 2" });
    const mockService2 = vi.fn(async (context) => {
      return `Processed: ${context.data}`;
    });

    const serviceCalls = [
      { name: "service1", function: mockService1 },
      { name: "service2", function: mockService2 },
    ];

    const result = await executor.execute(serviceCalls, {});
    expect(mockService1).toHaveBeenCalledTimes(1);
    expect(mockService2).toHaveBeenCalledTimes(1);
    expect(mockService2).toHaveBeenCalledWith(expect.objectContaining({
      data: "Context for Service 2",
    }));
    expect(result).toEqual(["Context for Service 2", "Processed: Context for Service 2"]);
  });
});