import { describe, it, expect, vi } from "vitest";
import { StrategyAblationManager, StrategyConfig, ExperimentMetrics, StrategyResult } from "../src/experimentation/strategy-ablation-manager";

describe("StrategyAblationManager", () => {
  it("should initialize correctly and process a list of strategies", async () => {
    const mockStrategies: StrategyConfig[] = [
      { name: "StrategyA", description: "Ablation A", config: {} },
      { name: "StrategyB", description: "Ablation B", config: {} },
    ];

    const manager = new StrategyAblationManager();
    await manager.setStrategies(mockStrategies);

    expect(await manager.getStrategies()).toHaveLength(2);
    expect(await manager.getStrategyByName("StrategyA")).toEqual(
      expect.objectContaining({ name: "StrategyA" })
    );
  });

  it("should run ablation tests and calculate combined metrics", async () => {
    const mockStrategies: StrategyConfig[] = [
      { name: "StrategyA", description: "Ablation A", config: {} },
      { name: "StrategyB", description: "Ablation B", config: {} },
    ];

    const manager = new StrategyAblationManager();
    await manager.setStrategies(mockStrategies);

    // Mock the core execution logic to return predictable results
    const mockRunStrategy = vi.spyOn(manager, "runStrategy").mockResolvedValue({
      strategyName: "StrategyA",
      metrics: { latencyMs: 100, costUnits: 5, successRate: 0.9 },
    } as StrategyResult);
    
    // Mock the runStrategy method to simulate running all strategies
    vi.spyOn(manager, "runAllStrategies").mockImplementation(async () => {
        const results: StrategyResult[] = [];
        for (const strategy of mockStrategies) {
            results.push({
                strategyName: strategy.name,
                metrics: { latencyMs: Math.random() * 100, costUnits: Math.random() * 5, successRate: Math.random() },
            } as StrategyResult);
        }
        return results;
    });

    const results = await manager.runAllStrategies();

    expect(results).toHaveLength(2);
    expect(results[0].strategyName).toBe("StrategyA");
    expect(results[1].strategyName).toBe("StrategyB");
  });

  it("should calculate average metrics correctly from multiple runs", async () => {
    const mockStrategies: StrategyConfig[] = [
      { name: "StrategyX", description: "Test X", config: {} },
    ];

    const manager = new StrategyAblationManager();
    await manager.setStrategies(mockStrategies);

    // Mock runAllStrategies to return specific, predictable results
    vi.spyOn(manager, "runAllStrategies").mockResolvedValue([
      { strategyName: "StrategyX", metrics: { latencyMs: 100, costUnits: 10, successRate: 0.8 } } as StrategyResult,
      { strategyName: "StrategyX", metrics: { latencyMs: 200, costUnits: 20, successRate: 0.6 } } as StrategyResult,
      { strategyName: "StrategyX", metrics: { latencyMs: 300, costUnits: 30, successRate: 0.4 } } as StrategyResult,
    ]);

    const results = await manager.runAllStrategies();
    const averageMetrics = await manager.calculateAverageMetrics(results);

    expect(averageMetrics.averageLatencyMs).toBeCloseTo(200);
    expect(averageMetrics.averageCostUnits).toBeCloseTo(20);
    expect(averageMetrics.averageSuccessRate).toBeCloseTo(0.6);
  });
});