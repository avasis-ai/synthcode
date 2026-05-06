import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface RouteCandidate {
  actionName: string;
  actionPayload: Record<string, unknown>;
  // Weights provided by the system/caller
  relevanceScore: number;
  utilityWeight: number;
  costEstimate: number;
}

export class ContextualRouter {
  private scoringFunction: (
    context: Message[],
    candidate: RouteCandidate,
    weights: {
      relevance: number;
      utility: number;
      cost: number;
    }
  ) => number;

  constructor(scoringFunction: (
    context: Message[],
    candidate: RouteCandidate,
    weights: {
      relevance: number;
      utility: number;
      cost: number;
    }
  ) => number) {
    this.scoringFunction = scoringFunction;
  }

  /**
   * Calculates the final weighted score for a single candidate.
   * @param context The history of messages.
   * @param candidate The potential next action.
   * @param weights Global weights for scoring components.
   * @returns The calculated score.
   */
  private calculateScore(
    context: Message[],
    candidate: RouteCandidate,
    weights: {
      relevance: number;
      utility: number;
      cost: number;
    }
  ): number {
    return this.scoringFunction(context, candidate, weights);
  }

  /**
   * Analyzes the context and a set of candidates to return a ranked list of the most probable next steps.
   * @param context The current conversation history.
   * @param candidates The list of potential next actions.
   * @param weights Global weights used for scoring (e.g., how much to prioritize utility vs cost).
   * @returns A sorted array of RouteCandidate objects, ranked by score (highest first).
   */
  public route(
    context: Message[],
    candidates: RouteCandidate[],
    weights: {
      relevance: number;
      utility: number;
      cost: number;
    }
  ): ReadonlyArray<RouteCandidate> {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const scoredCandidates = candidates.map((candidate) => {
      const score = this.calculateScore(context, candidate, weights);
      return { candidate, score };
    });

    const sortedCandidates = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .map((item) => item.candidate);

    return sortedCandidates;
  }
}

export function createDefaultRouter(
  scoringFunction: (
    context: Message[],
    candidate: RouteCandidate,
    weights: {
      relevance: number;
      utility: number;
      cost: number;
    }
  ) => number = (context, candidate, weights) => {
    // Default scoring: Weighted combination of provided scores.
    // Score = (Relevance * W_rel) + (Utility * W_util) - (Cost * W_cost)
    return (
      candidate.relevanceScore * weights.relevance +
      candidate.utilityWeight * weights.utility -
      candidate.costEstimate * weights.cost
    );
  ): ContextualRouter {
  return new ContextualRouter(scoringFunction);
}