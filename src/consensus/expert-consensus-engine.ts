export type ExpertId = string;

export interface ExpertInput {
  expertId: ExpertId;
  confidenceScore: number;
  proposedAction: string;
}

export interface ConflictReport {
  disagreements: Record<string, number>;
  summary: string;
}

export interface ConsensusResult {
  finalAction: string;
  weightedScore: number;
  conflictReport: ConflictReport;
}

export class ExpertConsensusEngine {
  private inputs: ExpertInput[] = [];

  submitInput(input: ExpertInput): void {
    this.inputs.push(input);
  }

  private calculateWeightedAverage(inputs: ExpertInput[]): number {
    if (inputs.length === 0) {
      return 0;
    }
    const totalScore = inputs.reduce((sum, input) => sum + input.confidenceScore, 0);
    return totalScore / inputs.length;
  }

  private resolveConflict(inputs: ExpertInput[]): { finalAction: string; report: ConflictReport } {
    if (inputs.length === 0) {
      return { finalAction: "No input provided.", report: { disagreements: {}, summary: "No inputs." } };
    }

    const actionCounts: Record<string, number> = {};
    inputs.forEach(input => {
      actionCounts[input.proposedAction] = (actionCounts[input.proposedAction] || 0) + 1;
    });

    let mostFrequentAction: string = inputs[0].proposedAction;
    let maxCount: number = 0;

    for (const action in actionCounts) {
      if (actionCounts[action] > maxCount) {
        maxCount = actionCounts[action];
        mostFrequentAction = action;
      }
    }

    const conflictReport: ConflictReport = {
      disagreements: actionCounts,
      summary: `Identified ${Object.keys(actionCounts).length} unique proposals. The consensus favors "${mostFrequentAction}" with ${maxCount} votes.`
    };

    return { finalAction: mostFrequentAction, report: conflictReport };
  }

  calculateConsensus(): ConsensusResult {
    if (this.inputs.length === 0) {
      return {
        finalAction: "Awaiting expert input.",
        weightedScore: 0,
        conflictReport: { disagreements: {}, summary: "No inputs submitted." },
      };
    }

    const weightedScore = this.calculateWeightedAverage(this.inputs);
    const { finalAction: resolvedAction, report: conflictReport } = this.resolveConflict(this.inputs);

    return {
      finalAction: resolvedAction,
      weightedScore: weightedScore,
      conflictReport: conflictReport,
    };
  }

  reset(): void {
    this.inputs = [];
  }
}

export { ExpertConsensusEngine };