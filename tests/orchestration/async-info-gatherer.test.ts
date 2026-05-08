import { describe, it, expect, vi } from "vitest";
import { AsyncInformationGatherer } from "../src/orchestration/async-info-gatherer.js";

describe("AsyncInformationGatherer", () => {
  it("should successfully gather information from multiple sources", async () => {
    const gatherer = new AsyncInformationGatherer();

    const mockApiCall = vi.fn(async (params) => {
      if (params.sourceId === "source1") {
        return { data: "Info from source 1", sourceId: "source1" };
      }
      if (params.sourceId === "source2") {
        return { data: "Info from source 2", sourceId: "source2" };
      }
      return null;
    });

    const tasks: any[] = [
      { id: "source1", apiCall: mockApiCall, params: { sourceId: "source1" }, maxRetries: 1, timeoutMs: 1000 },
      { id: "source2", apiCall: mockApiCall, params: { sourceId: "source2" }, maxRetries: 1, timeoutMs: 1000 },
    ];

    const results = await gatherer.gatherInformation(tasks);

    expect(results).toHaveLength(2);
    expect(results.some((r: any) => r.sourceId === "source1" && r.data === "Info from source 1")).toBe(true);
    expect(results.some((r: any) => r.sourceId === "source2" && r.data === "Info from source 2")).toBe(true);
    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });

  it("should handle failures and return partial results", async () => {
    const gatherer = new AsyncInformationGatherer();

    const mockApiCall = vi.fn(async (params) => {
      if (params.sourceId === "source1") {
        return { data: "Success data" };
      }
      if (params.sourceId === "source2") {
        throw new Error("API failure");
      }
      return null;
    });

    const tasks: any[] = [
      { id: "source1", apiCall: mockApiCall, params: { sourceId: "source1" }, maxRetries: 0, timeoutMs: 1000 },
      { id: "source2", apiCall: mockApiCall, params: { sourceId: "source2" }, maxRetries: 0, timeoutMs: 1000 },
    ];

    const results = await gatherer.gatherInformation(tasks);

    expect(results).toHaveLength(2);
    expect(results.some((r: any) => r.sourceId === "source1" && r.success === true)).toBe(true);
    expect(results.some((r: any) => r.sourceId === "source2" && r.success === false && r.error?.includes("API failure"))).toBe(true);
    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });

  it("should handle an empty list of tasks gracefully", async () => {
    const gatherer = new AsyncInformationGatherer();
    const tasks: any[] = [];

    const results = await gatherer.gatherInformation(tasks);

    expect(results).toEqual([]);
  });
});