import { performance } from "node:perf_hooks";

export interface StrategyConfig {
  name: string;
  description: string;
  // Placeholder for actual configuration details (e.g., prompt template, tool priority)
  config: Record<string, unknown>;
}

export interface ExperimentMetrics {
  latencyMs: number;
  costUnits: number;
  successRate: number;
  // Add other comparative metrics as needed
}

export interface StrategyResult {
  strategyName: string;
  metrics: ExperimentMetrics;
  // Optionally include the full output or log for comparison
  output: string;
}

export interface AblationReport {
  timestamp: Date;
  totalStrategiesTested: number;
  averageMetrics: {
    latencyMs: number;
    costUnits: number;
    successRate: number;
  };
  results: StrategyResult[];
  optimalStrategyName: string | null;
}

export class StrategyAblationManager {
  /**
   * Runs a series of experiments (A/B/N testing) on different strategies.
   *
   * @param strategies The list of strategies to test.
   * @param coreExecutionFn The function that executes the experiment for a given strategy.
   *        It must accept StrategyConfig and return a Promise<StrategyResult>.
   * @returns A Promise resolving to the comparative AblationReport.
   */
  public async runExperiment(
    strategies: StrategyConfig[],
    coreExecutionFn: (config: StrategyConfig) => Promise<StrategyResult>
  ): Promise<AblationReport> {
    if (!strategies || strategies.length === 0) {
      throw new Error("Cannot run experiment: Strategy list is empty.");
    }

    const promises = strategies.map(async (strategy) => {
      try {
        const result = await coreExecutionFn(strategy);
        return result;
      } catch (error) {
        console.error(`Error running experiment for ${strategy.name}:`, error);
        return {
          strategyName: strategy.name,
          metrics: {
            latencyMs: 0,
            costUnits: 0,
            successRate: 0,
          },
          output: `Execution failed: ${(error as Error).message}`,
        };
      }
    });

    const results = await Promise.all(promises);

    const totalLatency = results.reduce((acc, r) => acc + r.metrics.latencyMs, 0);
    const totalCost = results.reduce((acc, r) => acc + r.metrics.costUnits, 0);
    const totalSuccess = results.filter(r => r.metrics.successRate > 0).length;

    const report: AblationReport = {
      timestamp: new Date(),
      totalStrategiesTested: strategies.length,
      averageMetrics: {
        latencyMs: parseFloat((totalLatency / strategies.length).toFixed(2)),
        costUnits: parseFloat((totalCost / strategies.length).toFixed(2)),
        successRate: parseFloat((totalSuccess / strategies.length).toFixed(2)),
      },
      results: results,
      optimalStrategyName: this.determineOptimalStrategy(results),
    };

    return report;
  }

  /**
   * Simple heuristic to determine the best strategy based on metrics.
   * Prioritizes high success rate, then low latency, then low cost.
   * @param results The collected results from all strategies.
   * @returns The name of the optimal strategy.
   */
  private determineOptimalStrategy(results: StrategyResult[]): string | null {
    if (results.length === 0) {
      return null;
    }

    // Sort criteria:
    // 1. Descending Success Rate (Highest first)
    // 2. Ascending Latency (Lowest first)
    // 3. Ascending Cost (Lowest first)
    const sortedResults = [...results].sort((a, b) => {
      if (b.metrics.successRate !== a.metrics.successRate) {
        return b.metrics.successRate - a.metrics.successRate;
      }
      if (a.metrics.latencyMs !== b.metrics.latencyMs) {
        return a.metrics.latencyMs - b.metrics.latencyMs;
      }
      return a.metrics.costUnits - b.metrics.costUnits;
    });

    return sortedResults[0].strategyName;
  }
}