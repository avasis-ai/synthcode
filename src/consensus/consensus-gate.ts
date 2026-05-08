import { Message } from "./types";

type VoteType = "APPROVAL" | "VETO";

export interface Vote {
  expertId: string;
  voteType: VoteType;
  weight: number;
}

export enum GateState {
  PENDING,
  WAITING_FOR_VOTES,
  APPROVED,
  VETOED,
}

export interface ConsensusPolicy {
  requiredApprovals: number;
  maxVetoes: number;
  totalExperts: number;
}

export class ConsensusGate {
  private state: GateState;
  private policy: ConsensusPolicy;
  private votes: Vote[] = [];

  constructor(policy: ConsensusPolicy) {
    this.policy = policy;
    this.state = GateState.PENDING;
  }

  getState(): GateState {
    return this.state;
  }

  getVotes(): ReadonlyArray<Vote> {
    return this.votes;
  }

  private checkConsensus(): GateState {
    if (this.votes.length < this.policy.requiredApprovals) {
      return GateState.WAITING_FOR_VOTES;
    }

    const approvalCount = this.votes.filter(v => v.voteType === "APPROVAL").length;
    const vetoCount = this.votes.filter(v => v.voteType === "VETO").length;

    if (vetoCount > this.policy.maxVetoes) {
      return GateState.VETOED;
    }

    if (approvalCount >= this.policy.requiredApprovals) {
      return GateState.APPROVED;
    }

    return GateState.WAITING_FOR_VOTES;
  }

  /**
   * Submits a vote and updates the gate's state if consensus is reached.
   * @param vote The vote object.
   * @returns The new state of the gate.
   */
  submitVote(vote: Vote): GateState {
    if (this.state === GateState.APPROVED || this.state === GateState.VETOED) {
      return this.state;
    }

    if (this.state === GateState.PENDING) {
      this.state = GateState.WAITING_FOR_VOTES;
    }

    // Prevent duplicate votes from the same expert
    const isDuplicate = this.votes.some(v => v.expertId === vote.expertId);
    if (isDuplicate) {
      return this.state;
    }

    this.votes.push(vote);
    
    const newState = this.checkConsensus();
    this.state = newState;
    
    return this.state;
  }
}

export { ConsensusGate, VoteType, GateState, ConsensusPolicy };