import { EventEmitter } from "node:events"

export interface Observation {
  sourceId: string
  content: string
  confidence: number
}

export interface ConsensusObservation {
  content: string
  confidence: number
  sources: string[]
}

export type AggregationStrategy = "simple_average" | "weighted_average" | "majority_vote"

export class WeightedObservationAggregator {
  private observations: Observation[]

  constructor() {
    this.observations = []
  }

  addObservation(observation: Observation): void {
    this.observations.push(observation)
  }

  /**
   * Calculates the consensus observation based on the provided strategy.
   * @param strategy The aggregation method to use.
   * @returns ConsensusObservation
   */
  calculateConsensus(strategy: AggregationStrategy): ConsensusObservation {
    if (this.observations.length === 0) {
      throw new Error("Cannot calculate consensus: No observations provided.")
    }

    let aggregatedContent: string
    let aggregatedConfidence: number
    const sources: string[] = this.observations.map(obs => obs.sourceId)

    switch (strategy) {
      case "simple_average":
        ({ aggregatedContent, aggregatedConfidence } = this.calculateSimpleAverage())
        break
      case "weighted_average":
        ({ aggregatedContent, aggregatedConfidence } = this.calculateWeightedAverage())
        break
      case "majority_vote":
        ({ aggregatedContent, aggregatedConfidence } = this.calculateMajorityVote())
        break
      default:
        throw new Error("Unsupported aggregation strategy.")
    }

    return {
      content: aggregatedContent,
      confidence: aggregatedConfidence,
      sources: sources,
    }
  }

  private calculateSimpleAverage(): { aggregatedContent: string; aggregatedConfidence: number } {
    const totalConfidence = this.observations.reduce((sum, obs) => sum + obs.confidence, 0)
    const averageConfidence = totalConfidence / this.observations.length

    const combinedContent = this.observations.map(obs => obs.content).join(" | ")

    return {
      aggregatedContent: combinedContent,
      aggregatedConfidence: averageConfidence,
    }
  }

  private calculateWeightedAverage(): { aggregatedContent: string; aggregatedConfidence: number } {
    // For simplicity, we assume the weight is proportional to the confidence score itself
    const totalWeightedConfidence = this.observations.reduce(
      (sum, obs) => sum + (obs.confidence * obs.confidence),
      0
    )
    const sumOfWeights = this.observations.reduce((sum, obs) => sum + obs.confidence, 0)

    // Weighted average confidence: Sum(w*v) / Sum(w)
    const weightedConfidence = totalWeightedConfidence / sumOfWeights

    const combinedContent = this.observations.map(obs => `[C:${obs.confidence.toFixed(2)}] ${obs.content}`).join(" || ")

    return {
      aggregatedContent: combinedContent,
      aggregatedConfidence: weightedConfidence,
    }
  }

  private calculateMajorityVote(): { aggregatedContent: string; aggregatedConfidence: number } {
    // Simple implementation: Find the most common key phrase or consensus text.
    // Here, we just take the first observation's content as the 'consensus' and average confidence.
    const consensusContent = this.observations[0].content
    const averageConfidence = this.observations.reduce(
      (sum, obs) => sum + obs.confidence,
      0
    ) / this.observations.length

    return {
      aggregatedContent: `Consensus reached: ${consensusContent}`,
      aggregatedConfidence: averageConfidence,
    }
  }
}

export { WeightedObservationAggregator }