import { performance } from "node:perf_hooks";

type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };
type ContentBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "thinking"; thinking: string };

interface Hypothesis {
    name: string;
    // The core logic to test. Should return a promise resolving to the final output/result.
    run: (input: string) => Promise<any>;
    // The control group run (baseline).
    baseline: (input: string) => Promise<any>;
    // Function to extract quantifiable metrics from the run result.
    metricExtractor: (result: any) => Record<string, number>;
}

interface TestResult {
    runName: string;
    metrics: Record<string, number>;
}

export class HypothesisTestRunner {
    private hypotheses: Hypothesis[];
    private numRuns: number;

    constructor(hypotheses: Hypothesis[], numRuns: number = 5) {
        this.hypotheses = hypotheses;
        this.numRuns = numRuns;
    }

    public async runTests(input: string): Promise<TestResult[]> {
        const allResults: TestResult[] = [];

        for (const hypothesis of this.hypotheses) {
            const runResults: Record<string, number>[] = [];

            // 1. Run Baseline (Control Group)
            const baselineResult = await hypothesis.baseline(input);
            const baselineMetrics = hypothesis.metricExtractor(baselineResult);
            runResults.push(baselineMetrics);

            // 2. Run Hypothesis N times
            for (let i = 0; i < this.numRuns; i++) {
                const runResult = await hypothesis.run(input);
                const metrics = hypothesis.metricExtractor(runResult);
                runResults.push(metrics);
            }

            // Aggregate results for the hypothesis
            const aggregatedMetrics: Record<string, number> = {};
            const metricKeys = Object.keys(runResults[0] || {});

            for (const key of metricKeys) {
                let sum = 0;
                for (const metrics of runResults) {
                    sum += metrics[key];
                }
                aggregatedMetrics[key] = sum / runResults.length;
            }

            allResults.push({
                runName: hypothesis.name,
                metrics: aggregatedMetrics
            });
        }

        return allResults;
    }
}

export class HypothesisTestReport {
    private results: TestResult[];

    constructor(results: TestResult[]) {
        this.results = results;
    }

    public generateReport(): Record<string, any> {
        if (this.results.length === 0) {
            return { error: "No test results provided." };
        }

        const baselineResult = this.results.find(r => r.runName.includes("Baseline"));
        const hypothesesResults = this.results.filter(r => !r.runName.includes("Baseline"));

        if (!baselineResult) {
            return { error: "Baseline result not found." };
        }

        const baselineMetrics = baselineResult.metrics;
        const bestHypothesis = this.findBestHypothesis(hypothesesResults, baselineMetrics);

        const comparison: Record<string, any> = {};
        for (const key in baselineMetrics) {
            const baselineValue = baselineMetrics[key];
            const bestValue = bestHypothesis ? bestHypothesis.metrics[key] : null;

            comparison[key] = {
                baseline: baselineValue,
                best_hypothesis: bestValue,
                improvement: bestValue !== null ? (baselineValue - bestValue) : null,
                is_significant: bestValue !== null && (Math.abs(baselineValue - bestValue) / Math.max(Math.abs(baselineValue), Math.abs(bestValue))) > 0.1 ? "Potential Improvement" : "No Significant Change"
            };
        }

        return {
            summary: "Hypothesis Testing Report",
            baseline_metrics: baselineMetrics,
            best_hypothesis_metrics: bestHypothesis ? bestHypothesis.metrics : null,
            comparisons: comparison
        };
    }

    private findBestHypothesis(results: TestResult[], baseline: Record<string, number>): { metrics: Record<string, number) | null } {
        let bestScore = -Infinity;
        let bestHypothesisMetrics: Record<string, number> | null = null;

        for (const result of results) {
            let currentScore = 0;
            let isBetterThanBaseline = false;

            for (const key in baseline) {
                const baselineValue = baseline[key];
                const hypothesisValue = result.metrics[key] || 0;

                // Simple scoring: prioritize lower latency and higher success rate
                if (key === "latency_ms") {
                    currentScore += (1 / (hypothesisValue + 1e-6));
                } else if (key === "success_rate") {
                    currentScore += hypothesisValue;
                } else {
                    currentScore += 0;
                }
            }

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestHypothesisMetrics = result.metrics;
            }
        }
        return bestHypothesisMetrics;
    }
}

export { Hypothesis, HypothesisTestRunner, HypothesisTestReport };