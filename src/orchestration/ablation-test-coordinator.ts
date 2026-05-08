import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface TestConfiguration {
  name: string;
  toolsToExclude: string[];
  promptOverrides: Record<string, string>;
}

interface TestResult {
  configurationName: string;
  finalMessage: Message;
  metrics: Record<string, number>;
  executionLog: string[];
}

interface InitialPlan {
  context: string;
  messages: Message[];
}

class PlanSimulationEngine {
  async simulate(plan: InitialPlan, config: TestConfiguration): Promise<TestResult> {
    console.log(`[Engine] Running simulation for: ${config.name}`);
    
    // Mock simulation logic: In a real scenario, this would invoke the LLM/Agent framework
    // with modified tools/prompts based on the configuration.
    
    const mockMetrics: Record<string, number> = {
      successRate: Math.random() * 100,
      latencyMs: Math.floor(Math.random() * 5000) + 1000,
      toolCallsMade: Math.floor(Math.random() * 5) + 1,
    };

    const mockLog: string[] = [
      `Starting simulation with config: ${config.name}`,
      `Tools excluded: ${config.toolsToExclude.join(', ')}`,
      `Prompt overrides applied: ${Object.keys(config.promptOverrides).length > 0 ? 'Yes' : 'No'}`,
      `Simulation completed successfully.`
    ];

    const finalMessage: Message = {
      role: "assistant",
      content: [{ type: "text", text: `Simulation result for ${config.name} completed.` }]
    };

    return {
      configurationName: config.name,
      finalMessage: finalMessage,
      metrics: mockMetrics,
      executionLog: mockLog,
    };
  }
}

export class AblationTestCoordinator {
  private engine: PlanSimulationEngine;

  constructor() {
    this.engine = new PlanSimulationEngine();
  }

  /**
   * Runs a series of ablation tests comparing how different component modifications
   * affect the outcome of a core plan.
   * @param configurations An array of test configurations (modifications).
   * @param initialPlan The base plan/context to be tested.
   * @returns A promise resolving to an array of structured test results.
   */
  public async runAblationTest(
    configurations: TestConfiguration[],
    initialPlan: InitialPlan
  ): Promise<TestResult[]> {
    if (!configurations || configurations.length === 0) {
      throw new Error("AblationTestCoordinator requires at least one test configuration.");
    }

    const results: TestResult[] = [];
    
    for (const config of configurations) {
      try {
        const result = await this.engine.simulate(initialPlan, config);
        results.push(result);
      } catch (error) {
        console.error(`Failed to run test for ${config.name}:`, error);
        results.push({
          configurationName: config.name,
          finalMessage: { role: "assistant", content: [] },
          metrics: { error: 1 },
          executionLog: [`ERROR: Failed to execute test for ${config.name}.`, (error as Error).message],
        });
      }
    }

    return results;
  }

  /**
   * Generates a structured comparison report from the collected test results.
   * @param results The array of TestResult objects.
   * @returns A summary object detailing the comparison.
   */
  public generateComparisonReport(results: TestResult[]): Record<string, any> {
    if (results.length === 0) {
      return { summary: "No results provided for comparison." };
    }

    const summary: Record<string, any> = {
      totalTestsRun: results.length,
      averageMetrics: {
        successRate: 0,
        latencyMs: 0,
        toolCallsMade: 0,
      },
      detailedComparison: results.map(r => ({
        name: r.configurationName,
        metrics: r.metrics,
        summaryMessage: r.finalMessage.content[0]?.text || "N/A",
      }))
    };

    const totalSuccessRate = results.reduce((sum, r) => sum + (r.metrics.successRate || 0), 0);
    const totalLatency = results.reduce((sum, r) => sum + (r.metrics.latencyMs || 0), 0);
    const totalToolCalls = results.reduce((sum, r) => sum + (r.metrics.toolCallsMade || 0), 0);

    summary.averageMetrics.successRate = parseFloat((totalSuccessRate / results.length).toFixed(2));
    summary.averageMetrics.latencyMs = Math.floor(totalLatency / results.length);
    summary.averageMetrics.toolCallsMade = Math.floor(totalToolCalls / results.length);

    return summary;
  }
}