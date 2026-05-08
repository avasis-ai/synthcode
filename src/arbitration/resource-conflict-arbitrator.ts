export type ResourceNeeds = Record<string, number>;

export interface GoalWeights {
  priority: number;
  urgency: number;
  costBenefit: number;
}

export interface ConflictProposal {
  id: string;
  resourceNeeds: ResourceNeeds;
  goalWeights: GoalWeights;
  description: string;
}

export interface GrantedResource {
  resource: string;
  amount: number;
}

export interface AllocationPlan {
  grantedProposals: {
    proposalId: string;
    allocatedResources: GrantedResource[];
  }[];
  deniedProposals: {
    proposalId: string;
    reason: string;
  }[];
  totalResourceUsage: Record<string, number>;
}

export class ResourceConflictArbitrator {
  /**
   * Calculates a weighted score for a given proposal.
   * Score = (Priority * P) + (Urgency * U) + (CostBenefit * C)
   */
  private calculateScore(proposal: ConflictProposal): number {
    const { goalWeights } = proposal;
    return (
      goalWeights.priority * goalWeights.priority +
      goalWeights.urgency * goalWeights.urgency +
      goalWeights.costBenefit * goalWeights.costBenefit
    );
  }

  /**
   * Arbitrates multiple resource conflict proposals to generate a conflict-free allocation plan.
   * @param proposals Array of conflict proposals.
   * @returns A detailed AllocationPlan.
   */
  public arbitrate(proposals: ConflictProposal[]): AllocationPlan {
    if (!proposals || proposals.length === 0) {
      return {
        grantedProposals: [],
        deniedProposals: [],
        totalResourceUsage: {},
      };
    }

    // 1. Score and sort proposals (Highest score first)
    const scoredProposals = proposals
      .map(p => ({
        proposal: p,
        score: this.calculateScore(p),
      }))
      .sort((a, b) => b.score - a.score);

    let grantedProposals: {
      proposalId: string;
      allocatedResources: GrantedResource[];
    }[] = [];
    let deniedProposals: {
      proposalId: string;
      reason: string;
    }[] = [];
    let currentUsage: Record<string, number> = {};

    // Initialize usage tracking
    const initializeUsage = (resources: ResourceNeeds): void => {
      for (const resource in resources) {
        if (typeof resources[resource] === 'number' && resources[resource] > 0) {
          currentUsage[resource] = (currentUsage[resource] || 0) + resources[resource];
        }
      }
    };

    // 2. Greedy selection based on score
    for (const { proposal: proposal, score } of scoredProposals) {
      const needs = proposal.resourceNeeds;
      let canGrant = true;
      const allocatedResources: GrantedResource[] = [];

      // Check for conflicts
      for (const resource in needs) {
        const requiredAmount = needs[resource];
        const currentUsed = currentUsage[resource] || 0;
        
        // Assuming a theoretical maximum capacity of 100 for all resources for simplicity
        const capacity = 100; 

        if (currentUsed + requiredAmount > capacity) {
          canGrant = false;
          break;
        }
        allocatedResources.push({
          resource: resource,
          amount: requiredAmount,
        });
      }

      if (canGrant) {
        // Grant the proposal and update usage
        grantedProposals.push({
          proposalId: proposal.id,
          allocatedResources: allocatedResources,
        });

        // Update global usage tracking
        for (const resource in needs) {
          const requiredAmount = needs[resource];
          currentUsage[resource] = (currentUsage[resource] || 0) + requiredAmount;
        }
      } else {
        // Deny the proposal
        deniedProposals.push({
          proposalId: proposal.id,
          reason: `Resource conflict detected. Required resources exceed available capacity (Capacity limit assumed).`,
        });
      }
    }

    return {
      grantedProposals,
      deniedProposals,
      totalResourceUsage: currentUsage,
    };
  }
}

export { ResourceConflictArbitrator };