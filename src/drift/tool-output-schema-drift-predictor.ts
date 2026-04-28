import {
  ToolDefinition,
  ToolOutputSchema,
  ToolOutputSample,
} from "../types";

export type FieldDriftReport = {
  fieldName: string;
  predictedDriftProbability: number;
  reason: string;
  suggestedAction: "Make Optional" | "Require Default" | "Monitor";
};

export type DriftPredictionReport = {
  overallStabilityScore: number;
  predictedDrifts: FieldDriftReport[];
  summary: string;
};

export class ToolOutputSchemaDriftPredictor {
  private readonly MIN_SAMPLES_FOR_ANALYSIS: number = 5;

  predictDrift(
    toolDefinition: ToolDefinition,
    historicalOutputs: ToolOutputSample[],
  ): DriftPredictionReport {
    if (historicalOutputs.length < this.MIN_SAMPLES_FOR_ANALYSIS) {
      return {
        overallStabilityScore: 1.0,
        predictedDrifts: [],
        summary: `Insufficient historical data (${historicalOutputs.length}/${this.MIN_SAMPLES_FOR_ANALYSIS} required) to predict significant drift. Assuming stability.`,
      };
    }

    const schema = toolDefinition.outputSchema;
    if (!schema || typeof schema !== "object") {
      return {
        overallStabilityScore: 0.0,
        predictedDrifts: [{
          fieldName: "N/A",
          predictedDriftProbability: 1.0,
          reason: "Tool output schema is missing or invalid.",
          suggestedAction: "Require Default",
        }],
        summary: "Cannot predict drift: Tool output schema is invalid.",
      };
    }

    const fieldAnalysis = this.analyzeSchemaDrift(schema, historicalOutputs);
    const drifts = this.generateDriftReports(schema, fieldAnalysis);

    const stabilityScore = this.calculateStabilityScore(drifts);

    return {
      overallStabilityScore: parseFloat(stabilityScore.toFixed(2)),
      predictedDrifts: drifts,
      summary: `Schema stability score: ${stabilityScore.toFixed(2)}. ${drifts.length} potential drifts detected. Review suggested actions for proactive schema updates.`,
    };
  }

  private analyzeSchemaDrift(
    schema: Record<string, any>,
    historicalOutputs: ToolOutputSample[],
  ): Map<string, {
    presentCount: number;
    nullCount: number;
    required: boolean;
  }> {
    const fieldStats = new Map<string, {
      presentCount: number;
      nullCount: number;
      required: boolean;
    }>();

    const fields = Object.keys(schema);

    for (const fieldName of fields) {
      fieldStats.set(
        fieldName,
        {
          presentCount: 0,
          nullCount: 0,
          required: schema[fieldName]?.required || false,
        },
      );
    }

    for (const output of historicalOutputs) {
      for (const fieldName of Object.keys(schema)) {
        const stats = fieldStats.get(fieldName)!;
        const value = output[fieldName];

        if (value !== undefined && value !== null) {
          stats.presentCount += 1;
        } else {
          stats.nullCount += 1;
        }
      }
    }
    return fieldStats;
  }

  private generateDriftReports(
    schema: Record<string, any>,
    fieldAnalysis: Map<string, {
      presentCount: number;
      nullCount: number;
      required: boolean;
    }>,
  ): FieldDriftReport[] {
    const reports: FieldDriftReport[] = [];
    const totalSamples = fieldAnalysis.size > 0 ? fieldAnalysis.get("dummy")?.presentCount || 1 : 1;

    for (const [fieldName, stats] of fieldAnalysis.entries()) {
      const { presentCount, nullCount, required } = stats;
      const totalObserved = presentCount + nullCount;

      if (totalObserved === 0) continue;

      const nullRate = nullCount / totalObserved;
      const presenceRate = presentCount / totalObserved;

      let predictedDriftProbability = 0;
      let suggestedAction: "Make Optional" | "Require Default" | "Monitor" = "Monitor";
      let reason: string = "";

      if (required && nullRate > 0.1) {
        predictedDriftProbability = Math.min(1.0, nullRate * 1.5);
        suggestedAction = "Make Optional";
        reason = `Field is marked required but has a ${Math.round(nullRate * 100)}% null rate in samples.`;
      } else if (!required && nullRate > 0.4) {
        predictedDriftProbability = Math.min(1.0, nullRate * 1.2);
        suggestedAction = "Make Optional";
        reason = `Field is optional but has a high null rate (${Math.round(nullRate * 100)}%). Consider making it truly optional or providing a default.`;
      } else if (presenceRate < 0.7 && required) {
        predictedDriftProbability = Math.min(1.0, (1 - presenceRate) * 1.5);
        suggestedAction = "Monitor";
        reason = `Field presence rate is low (${Math.round(presenceRate * 100)}%). Monitor closely for required field instability.`;
      } else {
        predictedDriftProbability = 0.0;
      }

      if (predictedDriftProbability > 0.1) {
        reports.push({
          fieldName,
          predictedDriftProbability: parseFloat(predictedDriftProbability.toFixed(2)),
          reason,
          suggestedAction,
        });
      }
    }
    return reports;
  }

  private calculateStabilityScore(drifts: FieldDriftReport[]): number {
    if (drifts.length === 0) return 1.0;

    const totalDriftScore = drifts.reduce((sum, drift) => sum + drift.predictedDriftProbability, 0);
    // Score is 1.0 (perfect) - (Average Drift Probability)
    const averageDrift = totalDriftScore / drifts.length;
    return Math.max(0.0, 1.0 - averageDrift * 0.8);
  }
}