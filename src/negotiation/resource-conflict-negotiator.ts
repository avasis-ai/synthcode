import { EventEmitter } from "node:events";

type PartyId = string;
type ResourceName = string;
type UtilityScore = number;

export interface ResourceAllocation {
  [resource: ResourceName]: {
    owner: PartyId;
    amount: number;
  };
}

export interface UtilityGains {
  [partyId: PartyId]: number;
}

export interface ConflictProposal {
  proposerId: PartyId;
  allocations: ResourceAllocation;
  utilityGains: UtilityGains;
  reasoning: string;
}

export enum NegotiationState {
  INITIAL,
  PROPOSAL_RECEIVED,
  COUNTER_PROPOSAL,
  CONSENSUS_REACHED,
  FAILURE,
}

export interface ConflictReport {
  parties: PartyId[];
  resources: ResourceName[];
  initialConflictSummary: string;
}

export class ResourceConflictNegotiator extends EventEmitter {
  private conflictReport: ConflictReport;
  private currentState: NegotiationState;
  private history: ConflictProposal[] = [];
  private currentAllocation: ResourceAllocation;

  constructor(conflictReport: ConflictReport) {
    super();
    this.conflictReport = conflictReport;
    this.currentState = NegotiationState.INITIAL;
    this.currentAllocation = {} as ResourceAllocation;
  }

  private calculateTotalUtility(proposals: ConflictProposal[]): UtilityGains {
    const utility: Record<PartyId, number> = {} as Record<PartyId, number>;
    for (const party of this.conflictReport.parties) {
      utility[party] = 0;
    }

    for (const proposal of proposals) {
      for (const party of this.conflictReport.parties) {
        if (proposal.utilityGains[party] !== undefined) {
          utility[party] = (utility[party] || 0) + proposal.utilityGains[party];
        }
      }
    }
    return utility;
  }

  public processProposal(proposal: ConflictProposal): NegotiationState {
    if (this.currentState === NegotiationState.CONSENSUS_REACHED) {
      return NegotiationState.FAILURE;
    }

    this.history.push(proposal);
    this.currentAllocation = proposal.allocations;
    
    const totalUtility = this.calculateTotalUtility(this.history);

    if (this.history.length === 1) {
      this.currentState = NegotiationState.PROPOSAL_RECEIVED;
    } else if (this.history.length > 1 && this.isConsensusAchieved(totalUtility)) {
      this.currentState = NegotiationState.CONSENSUS_REACHED;
    } else {
      this.currentState = NegotiationState.COUNTER_PROPOSAL;
    }

    this.emit("stateChange", {
      newState: this.currentState,
      utility: totalUtility,
      message: `Negotiation state updated to ${this.currentState}. Total utility calculated.`
    });

    return this.currentState;
  }

  private isConsensusAchieved(utility: UtilityGains): boolean {
    const averageUtility = Object.values(utility).reduce((a, b) => a + b, 0) / this.conflictReport.parties.length;
    const variance = Object.values(utility).map(u => Math.pow(u - averageUtility, 2)).reduce((a, b) => a + b, 0) / this.conflictReport.parties.length;

    // Simple heuristic: Consensus is reached if variance is low and total utility is positive.
    return variance < 5 && Object.values(utility).every(u => u >= 0);
  }

  public resolveConflict(): { success: boolean; resolution: ResourceAllocation; finalState: NegotiationState } {
    if (this.currentState === NegotiationState.INITIAL) {
      return { success: false, resolution: {} as ResourceAllocation, finalState: NegotiationState.FAILURE };
    }

    if (this.currentState === NegotiationState.CONSENSUS_REACHED) {
      return { success: true, resolution: this.currentAllocation, finalState: NegotiationState.CONSENSUS_REACHED };
    }

    // If we haven't reached consensus after processing all available proposals, we fail.
    return { success: false, resolution: this.currentAllocation, finalState: NegotiationState.FAILURE };
  }
}

export { ResourceConflictNegotiator, NegotiationState, ConflictProposal, ResourceAllocation, ConflictReport };