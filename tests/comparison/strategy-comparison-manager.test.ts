import { describe, it, expect } from "vitest";
import { StrategyComparisonManager } from "../src/comparison/strategy-comparison-manager";
import { Message } from "../src/comparison/types";

describe("StrategyComparisonManager", () => {
  it("should compare strategies and return the best result based on lowest_cost", async () => {
    const manager = new StrategyComparisonManager();
    const context: Message[] = [{
      id: "1",
      content: "Test context",
    }];

    const strategyA: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "A",
          content: "Result A",
        },
        metrics: {
          cost: 10,
          timeMs: 100,
          successRate: 0.9,
          contextUsage: 1,
        },
      };
    };

    const strategyB: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "B",
          content: "Result B",
        },
        metrics: {
          cost: 5,
          timeMs: 200,
          successRate: 0.8,
          contextUsage: 2,
        },
      };
    };

    const comparisonResult = await manager.compareStrategies([
      {
        name: "Strategy A",
        strategy: strategyA,
      },
      {
        name: "Strategy B",
        strategy: strategyB,
      },
    ], "lowest_cost", context, "test-context-id");

    expect(comparisonResult.bestStrategyName).toBe("Strategy B");
    expect(comparisonResult.bestStrategyMetrics.cost).toBe(5);
  });

  it("should compare strategies and return the best result based on fastest", async () => {
    const manager = new StrategyComparisonManager();
    const context: Message[] = [{
      id: "1",
      content: "Test context",
    }];

    const strategyA: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "A",
          content: "Result A",
        },
        metrics: {
          cost: 10,
          timeMs: 50,
          successRate: 0.9,
          contextUsage: 1,
        },
      };
    };

    const strategyB: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "B",
          content: "Result B",
        },
        metrics: {
          cost: 20,
          timeMs: 100,
          successRate: 0.8,
          contextUsage: 2,
        },
      };
    };

    const comparisonResult = await manager.compareStrategies([
      {
        name: "Strategy A",
        strategy: strategyA,
      },
      {
        name: "Strategy B",
        strategy: strategyB,
      },
    ], "fastest", context, "test-context-id");

    expect(comparisonResult.bestStrategyName).toBe("Strategy A");
    expect(comparisonResult.bestStrategyMetrics.timeMs).toBe(50);
  });

  it("should compare strategies and return the best result based on highest_success_rate", async () => {
    const manager = new StrategyComparisonManager();
    const context: Message[] = [{
      id: "1",
      content: "Test context",
    }];

    const strategyA: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "A",
          content: "Result A",
        },
        metrics: {
          cost: 10,
          timeMs: 100,
          successRate: 0.95,
          contextUsage: 1,
        },
      };
    };

    const strategyB: Strategy = async (context, contextId) => {
      return {
        result: {
          id: "B",
          content: "Result B",
        },
        metrics: {
          cost: 5,
          timeMs: 50,
          successRate: 0.9,
          contextUsage: 2,
        },
      };
    };

    const comparisonResult = await manager.compareStrategies([
      {
        name: "Strategy A",
        strategy: strategyA,
      },
      {
        name: "Strategy B",
        strategy: strategyB,
      },
    ], "highest_success_rate", context, "test-context-id");

    expect(comparisonResult.bestStrategyName).toBe("Strategy A");
    expect(comparisonResult.bestStrategyMetrics.successRate).toBe(0.95);
  });
});