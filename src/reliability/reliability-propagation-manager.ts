import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ReliabilitySource {
  source: string;
  weight: number;
}

export interface TransformationContext {
  complexityScore: number;
  assumptionsMade: number;
  riskFactor: number;
}

export interface ReliabilityPayload {
  data: any;
  reliabilityScore: number;
  sources: ReliabilitySource[];
  assumptions: number;
}

export class ReliabilityPropagationManager {
  constructor() {}

  /**
   * Calculates the new reliability score based on the input payload and the transformation context.
   * The formula generally decreases reliability based on risk/complexity and accumulates reliability from sources.
   * @param inputPayload The payload entering the current step.
   * @param transformationContext Context describing the transformation applied.
   * @returns A new ReliabilityPayload with the updated score.
   */
  propagate(
    inputPayload: ReliabilityPayload,
    transformationContext: TransformationContext
  ): ReliabilityPayload {
    const { reliabilityScore: initialScore, sources: initialSources, assumptions: initialAssumptions } = inputPayload;

    // 1. Calculate the degradation factor based on transformation risk and complexity.
    // High complexity or high risk significantly reduces confidence.
    const degradationFactor = 1.0 - (
      (transformationContext.complexityScore * 0.05) +
      (transformationContext.riskFactor * 0.1)
    );

    // Ensure degradation factor is not negative
    const effectiveDegradation = Math.max(0.1, degradationFactor);

    // 2. Calculate the new base score: Initial Score * Degradation Factor
    let newScore = initialScore * effectiveDegradation;

    // 3. Adjust for assumptions: Each assumption introduces a penalty.
    const assumptionPenalty = initialAssumptions * 0.05;
    newScore = Math.max(0.0, newScore - assumptionPenalty);

    // 4. Re-calculate the cumulative sources (simple weighted average for demonstration)
    const newSources = [
      ...initialSources,
      { source: "Transformation Step", weight: 1.0 - effectiveDegradation }
    ];

    // 5. Return the new payload
    return {
      data: inputPayload.data,
      reliabilityScore: parseFloat(newScore.toFixed(4)),
      sources: newSources,
      assumptions: initialAssumptions + transformationContext.assumptionsMade,
    };
  }

  /**
   * Creates an initial payload for the start of a process.
   * @param initialData The raw data starting the process.
   * @param initialReliability The starting confidence score (e.g., 1.0).
   * @returns A ReliabilityPayload.
   */
  createInitialPayload(initialData: any, initialReliability: number): ReliabilityPayload {
    return {
      data: initialData,
      reliabilityScore: Math.min(1.0, Math.max(0.0, initialReliability)),
      sources: [{ source: "Initial Input", weight: 1.0 }],
      assumptions: 0,
    };
  }
}