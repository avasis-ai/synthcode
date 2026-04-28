import { describe, it, expect } from "vitest";
import { ToolUsageHistoryAggregator } from "../src/history/tool-usage-history-aggregator";
import { ToolInvocationRecord } from "../src/history/tool-invocation-record";

describe("ToolUsageHistoryAggregator", () => {
  it("should correctly aggregate metrics from a single tool invocation", () => {
    const aggregator = new ToolUsageHistoryAggregator();
    const record: ToolInvocationRecord = {
      toolName: "search",
      invocationCount: 1,
      latencyMs: 100,
    };
    aggregator.addRecord(record);
    const summary = aggregator.getSummary();

    expect(summary.toolMetrics["search"].callCount).toBe(1);
    expect(summary.toolMetrics["search"].totalLatencyMs).toBe(100);
    expect(summary.toolMetrics["search"].totalApiCalls).toBe(1);
    expect(summary.toolMetrics["search"].averageLatencyMs).toBe(100);
    expect(summary.totalToolCalls).toBe(1);
    expect(summary.overallAverageLatencyMs).toBe(100);
  });

  it("should correctly aggregate metrics from multiple invocations of the same tool", () => {
    const aggregator = new ToolUsageHistoryAggregator();
    const record1: ToolInvocationRecord = {
      toolName: "search",
      invocationCount: 1,
      latencyMs: 100,
    };
    const record2: ToolInvocationRecord = {
      toolName: "search",
      invocationCount: 1,
      latencyMs: 200,
    };

    aggregator.addRecord(record1);
    aggregator.addRecord(record2);
    const summary = aggregator.getSummary();

    expect(summary.toolMetrics["search"].callCount).toBe(2);
    expect(summary.toolMetrics["search"].totalLatencyMs).toBe(300);
    expect(summary.toolMetrics["search"].totalApiCalls).toBe(2);
    expect(summary.toolMetrics["search"].averageLatencyMs).toBe(150);
    expect(summary.totalToolCalls).toBe(2);
    expect(summary.overallAverageLatencyMs).toBe(150);
  });

  it("should correctly aggregate metrics from multiple different tools", () => {
    const aggregator = new ToolUsageHistoryAggregator();
    const record1: ToolInvocationRecord = {
      toolName: "search",
      invocationCount: 1,
      latencyMs: 100,
    };
    const record2: ToolInvocationRecord = {
      toolName: "calculator",
      invocationCount: 1,
      latencyMs: 50,
    };
    const record3: ToolInvocationRecord = {
      toolName: "search",
      invocationCount: 1,
      latencyMs: 200,
    };

    aggregator.addRecord(record1);
    aggregator.addRecord(record2);
    aggregator.addRecord(record3);
    const summary = aggregator.getSummary();

    expect(summary.toolMetrics["search"].callCount).toBe(2);
    expect(summary.toolMetrics["search"].totalLatencyMs).toBe(300);
    expect(summary.toolMetrics["search"].averageLatencyMs).toBe(150);

    expect(summary.toolMetrics["calculator"].callCount).toBe(1);
    expect(summary.toolMetrics["calculator"].averageLatencyMs).toBe(50);

    expect(summary.totalToolCalls).toBe(3);
    expect(summary.overallAverageLatencyMs).toBe((100 + 50 + 200) / 3);
  });
});