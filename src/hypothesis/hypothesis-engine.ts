import { SimulationEngine } from "../simulation/simulation-engine.js";
import { KnowledgeGraph } from "../knowledge/knowledge-graph.js";

export interface Metric {
  name: string;
  expectedValue: unknown;
  actualValue: unknown;
  tolerance: number;
}

export interface Hypothesis {
  id: string;
  proposedAction: string;
  inputs: Record<string, unknown>;
  expectedMetrics: Metric[];
}

export interface HypothesisResult {
  hypothesisId: string;
  success: boolean;
  observedMetrics: Metric[];
  rawOutput: string;
}

export class HypothesisEngine {
  private simulationEngine: SimulationEngine;
  private knowledgeGraph: KnowledgeGraph;

  constructor(simulationEngine: SimulationEngine, knowledgeGraph: KnowledgeGraph) {
    this.simulationEngine = simulationEngine;
    this.knowledgeGraph = knowledgeGraph;
  }

  public async testHypothesis(hypothesis: Hypothesis): Promise<HypothesisResult> {
    const rawPrediction = await this.simulationEngine.runSimulation(
      hypothesis.proposedAction,
      hypothesis.inputs
    );

    const observedMetrics: Metric[] = hypothesis.expectedMetrics.map(expectedMetric => {
      const actual = this.evaluateMetric(expectedMetric, rawPrediction);
      return {
        name: expectedMetric.name,
        expectedValue: expectedMetric.expectedValue,
        actualValue: actual,
        tolerance: expectedMetric.tolerance,
      };
    });

    const success = observedMetrics.every(metric => this.isMetricSuccessful(metric));

    return {
      hypothesisId: hypothesis.id,
      success: success,
      observedMetrics: observedMetrics,
      rawOutput: rawPrediction,
    };
  }

  private evaluateMetric(expectedMetric: Metric, rawOutput: string): unknown {
    // Simplified evaluation logic: assumes rawOutput contains a JSON string
    try {
      const data = JSON.parse(rawOutput);
      if (typeof data === 'object' && data !== null) {
        return data[expectedMetric.name] || null;
      }
    } catch (e) {
      // Fallback if JSON parsing fails
    }
    return null;
  }

  private isMetricSuccessful(metric: Metric): boolean {
    if (metric.actualValue === null || metric.expectedValue === null) {
      return false;
    }
    // Basic comparison logic (assuming numeric comparison for simplicity)
    if (typeof metric.actualValue === 'number' && typeof metric.expectedValue === 'number') {
      return Math.abs(metric.actualValue - metric.expectedValue) <= metric.tolerance;
    }
    // Add more complex type checking as needed
    return true;
  }

  public async commitHypothesis(result: HypothesisResult): Promise<{ confidenceScore: number; updatedKnowledge: string }> {
    let confidenceScore = 0.0;
    let updatedKnowledge = "";

    if (result.success) {
      // Calculate confidence based on successful metrics
      const successfulMetrics = result.observedMetrics.filter(m => this.isMetricSuccessful(m));
      confidenceScore = successfulMetrics.length / result.observedMetrics.length;

      // Update Knowledge Graph
      const knowledgeUpdate = await this.knowledgeGraph.updateTriple(
        result.hypothesisId,
        "validated",
        "True"
      );
      updatedKnowledge = knowledgeUpdate;
    } else {
      // Record failure
      await this.knowledgeGraph.updateTriple(
        result.hypothesisId,
        "validated",
        "False"
      );
      updatedKnowledge = "Hypothesis failed validation.";
      confidenceScore = 0.0;
    }

    return {
      confidenceScore: confidenceScore,
      updatedKnowledge: updatedKnowledge,
    };
  }
}