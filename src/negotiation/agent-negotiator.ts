export type NegotiationState = "PENDING" | "CONFLICT" | "CONSENSUS_REACHED" | "FAILED";

export interface Proposal {
    agentId: string;
    goal: string;
    steps: string[];
    confidenceScore: number;
}

export interface NegotiationMessage {
    senderId: string;
    state: NegotiationState;
    message: string;
    proposal?: Proposal;
    votes?: Record<string, boolean>;
}

export class AgentNegotiator {
    private state: NegotiationState = "PENDING";
    private proposals: Map<string, Proposal> = new Map();
    private agentVotes: Map<string, Record<string, boolean>> = new Map();
    private agents: Set<string> = new Set();

    constructor() {}

    public initiateNegotiation(initialGoal: string, participatingAgentIds: string[]) {
        this.state = "PENDING";
        this.proposals.clear();
        this.agentVotes.clear();
        this.agents = new Set(participatingAgentIds);
    }

    public submitProposal(message: NegotiationMessage): NegotiationMessage {
        if (this.state === "FAILED") {
            return { senderId: message.senderId, state: "FAILED", message: "Cannot submit proposal, negotiation has failed." };
        }

        const proposal = message.proposal;
        if (!proposal) {
            return { senderId: message.senderId, state: this.state, message: "Invalid submission: Proposal missing." };
        }

        this.proposals.set(proposal.agentId, proposal);
        return { senderId: message.senderId, state: this.state, message: `Proposal received from ${proposal.agentId}. Awaiting further submissions.` };
    }

    public recordVote(message: NegotiationMessage): NegotiationMessage {
        if (this.state !== "PENDING") {
            return { senderId: message.senderId, state: this.state, message: "Cannot record vote, negotiation is not in the pending state." };
        }

        const senderId = message.senderId;
        const votes = message.votes;

        if (!votes) {
            return { senderId: senderId, state: this.state, message: "Invalid vote submission: Votes missing." };
        }

        if (!this.agentVotes.has(senderId)) {
            this.agentVotes.set(senderId, {});
        }

        const currentVotes = this.agentVotes.get(senderId)!;
        Object.assign(currentVotes, votes);

        return { senderId: senderId, state: this.state, message: `Vote recorded from ${senderId}. Current state: ${this.determineState()}` };
    }

    private determineState(): NegotiationState {
        if (this.proposals.size < 2) {
            return "PENDING";
        }

        const conflictCount = this.countConflictingProposals();

        if (conflictCount > 0) {
            return "CONFLICT";
        }

        // Simple consensus check: If all agents have voted and there are no conflicts, assume consensus.
        const totalVotes = Array.from(this.agentVotes.values()).reduce((acc, votes) => acc + Object.keys(votes).length, 0);
        if (totalVotes >= this.agents.size && this.proposals.size > 0) {
            return "CONSENSUS_REACHED";
        }

        return "PENDING";
    }

    private countConflictingProposals(): number {
        if (this.proposals.size < 2) return 0;

        const proposalsArray = Array.from(this.proposals.values());
        let conflictCount = 0;

        for (let i = 0; i < proposalsArray.length; i++) {
            for (let j = i + 1; j < proposalsArray.length; j++) {
                const p1 = proposalsArray[i];
                const p2 = proposalsArray[j];

                // Conflict detection logic: Check if goals or core steps diverge significantly
                const goalConflict = p1.goal !== p2.goal;
                const stepsConflict = p1.steps.length !== p2.steps.length || p1.steps.some((step, index) => step !== p2.steps[index]);

                if (goalConflict || stepsConflict) {
                    conflictCount++;
                }
            }
        }
        return conflictCount;
    }

    public resolveConflict(winningAgentId: string): NegotiationMessage {
        if (this.state !== "CONFLICT") {
            return { senderId: "SYSTEM", state: this.state, message: "Conflict resolution is only possible when the state is CONFLICT." };
        }

        const winningProposal = this.proposals.get(winningAgentId);
        if (!winningProposal) {
            return { senderId: "SYSTEM", state: "FAILED", message: "Cannot resolve conflict: Winning agent proposal not found." };
        }

        this.state = "CONSENSUS_REACHED";
        return {
            senderId: "SYSTEM",
            state: "CONSENSUS_REACHED",
            message: `Conflict resolved. Consensus reached based on ${winningAgentId}'s proposal.`,
            proposal: winningProposal
        };
    }

    public getConsensusPlan(): { plan: string[], confidence: number } | null {
        if (this.state !== "CONSENSUS_REACHED") {
            return null;
        }

        const finalProposal = Array.from(this.proposals.values()).find(p => p.agentId === "SYSTEM_WINNER");
        if (!finalProposal) {
            return null;
        }

        return {
            plan: finalProposal.steps,
            confidence: finalProposal.confidenceScore
        };
    }
}

export { AgentNegotiator };