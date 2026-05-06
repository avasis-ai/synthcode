import { Message, ContentBlock, TextBlock, ToolUseBlock } from "./types";

interface CandidateAction {
  name: string;
  input: Record<string, unknown>;
  description: string;
}

interface Hypothesis {
  candidate: CandidateAction;
  predictedCost: number;
  contextualRelevanceScore: number;
  constraintSatisfactionScore: number;
  finalScore: number;
  simulatedOutput: ContentBlock[];
}

export class HypothesisEngine {
  constructor() {}

  private calculateConstraintSatisfaction(context: Message[], candidate: CandidateAction): number {
    // Simplified logic: Check if the candidate action addresses the last user message's intent.
    // In a real system, this would involve complex semantic analysis.
    if (context.length === 0) return 0.5;

    const lastMessage = context[context.length - 1];
    if (lastMessage.role === "user" && typeof lastMessage.content === 'string') {
      const userText = lastMessage.content.toLowerCase();
      const candidateName = candidate.name.toLowerCase();

      if (userText.includes(candidateName.replace(/[^a-z]/g, ''))) {
        return 0.9;
      }
    }
    return 0.6;
  }

  private predictResourceUsage(candidate: CandidateAction): number {
    // Simplified cost model: Longer inputs or more complex names cost more.
    const inputComplexity = Object.keys(candidate.input).length * 0.1;
    const nameLength = candidate.name.length * 0.2;
    return Math.min(5.0, Math.max(0.5, inputComplexity + nameLength));
  }

  private simulateExecution(context: Message[], candidate: CandidateAction): { output: ContentBlock[]; score: number } {
    // Simulate a non-mutating execution path.
    // For simplicity, we assume the output is a text block confirming the action.
    const simulatedOutput: ContentBlock[] = [
      { type: "text", text: `[SIMULATION SUCCESS] Executed ${candidate.name} with input: ${JSON.stringify(candidate.input)}.` }
    ];

    // The score calculation combines multiple factors.
    const constraintScore = this.calculateConstraintSatisfaction(context, candidate);
    const cost = this.predictResourceUsage(candidate);

    // Scoring formula: (Constraint * 0.4) + (1 / Cost * 0.3) + (Contextual Relevance * 0.3)
    // Since we don't have a separate context relevance score, we use a placeholder based on name length.
    const relevance = Math.min(1.0, candidate.name.length / 10);

    const finalScore = (constraintScore * 0.4) + ((1 / cost) * 0.3) + (relevance * 0.3);

    return { output: simulatedOutput, score: finalScore };
  }

  simulate(context: Message[], candidates: CandidateAction[]): Hypothesis[] {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    return candidates.map(candidate => {
      const { output, score } = this.simulateExecution(context, candidate);

      const hypothesis: Hypothesis = {
        candidate: candidate,
        predictedCost: this.predictResourceUsage(candidate),
        contextualRelevanceScore: Math.min(1.0, candidate.name.length / 10),
        constraintSatisfactionScore: this.calculateConstraintSatisfaction(context, candidate),
        finalScore: score,
        simulatedOutput: output,
      };
      return hypothesis;
    });
  }
}