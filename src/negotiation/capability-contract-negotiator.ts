export type Message = {
    role: "user" | "assistant" | "tool";
    content: string | ContentBlock[];
    tool_use_id?: string;
    is_error?: boolean;
};

export type ContentBlock = {
    type: "text";
    text: string;
} | {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
} | {
    type: "thinking";
    thinking: string;
};

export enum ContractState {
    INITIALIZING,
    PROPOSING,
    REVIEWING,
    CONFLICT,
    AGREED,
    FAILED,
}

export type NegotiationResult = {
    status: "SUCCESS" | "PENDING" | "FAILURE";
    message: string;
    finalContract: Record<string, any> | null;
};

export class CapabilityContractNegotiator {
    private currentState: ContractState;
    private contractDetails: Record<string, any>;
    private history: Message[] = [];
    private readonly maxConflictRounds: number = 3;
    private currentConflictRound: number = 0;

    constructor(initialRequest: { capabilityId: string; requiredScope: string }) {
        this.currentState = ContractState.INITIALIZING;
        this.contractDetails = {
            capabilityId: initialRequest.capabilityId,
            requiredScope: initialRequest.requiredScope,
            terms: {}
        };
    }

    public getState(): ContractState {
        return this.currentState;
    }

    public getContractDetails(): Record<string, any> {
        return this.contractDetails;
    }

    public initializeNegotiation(): { result: NegotiationResult; message: string } {
        if (this.currentState !== ContractState.INITIALIZING) {
            return { result: { status: "FAILURE", message: "Negotiation already started or completed." }, message: "Error" };
        }

        this.currentState = ContractState.PROPOSING;
        this.history.push({
            role: "assistant",
            content: [{ type: "text", text: `Initiating negotiation for capability: ${this.contractDetails.capabilityId}` }]
        });

        return {
            result: { status: "PENDING", message: "Awaiting initial proposal from the counterparty." },
            message: "Negotiation initialized. Awaiting proposal."
        };
    }

    public submitProposal(proposal: { terms: Record<string, any> }): { result: NegotiationResult; message: string } {
        if (this.currentState === ContractState.AGREED || this.currentState === ContractState.FAILED) {
            return { result: { status: "FAILURE", message: "Cannot submit proposal; negotiation is finalized." }, message: "Error" };
        }

        this.history.push({
            role: "user",
            content: [{ type: "text", text: `Received proposal: ${JSON.stringify(proposal.terms)}` }]
        });

        this.contractDetails.terms = { ...this.contractDetails.terms, ...proposal.terms };

        if (this.currentState === ContractState.PROPOSING) {
            this.currentState = ContractState.REVIEWING;
            return { result: { status: "PENDING", message: "Proposal received. Reviewing terms." }, message: "Reviewing proposal." };
        }

        return { result: { status: "PENDING", message: "Proposal received. Further action required." }, message: "Proposal accepted for review." };
    }

    public handleConflict(conflictReport: { conflictPoint: string; proposedResolution: Record<string, any> }): { result: NegotiationResult; message: string } {
        if (this.currentState === ContractState.AGREED) {
            return { result: { status: "FAILURE", message: "Conflict cannot be handled; contract is already agreed." }, message: "Error" };
        }

        this.currentConflictRound++;
        this.history.push({
            role: "user",
            content: [{ type: "text", text: `Conflict detected at ${conflictReport.conflictPoint}. Resolution proposed: ${JSON.stringify(conflictReport.proposedResolution)}` }]
        });

        if (this.currentConflictRound > this.maxConflictRounds) {
            this.currentState = ContractState.FAILED;
            return { result: { status: "FAILURE", message: "Negotiation failed due to excessive conflicts." }, message: "Failure" };
        }

        this.contractDetails.terms = { ...this.contractDetails.terms, ...conflictReport.proposedResolution };
        this.currentState = ContractState.CONFLICT;

        return {
            result: { status: "PENDING", message: `Conflict handled. Awaiting counter-proposal or acceptance (Round ${this.currentConflictRound}/${this.maxConflictRounds}).` },
            message: `Conflict handled. Round ${this.currentConflictRound}.`
        };
    }

    public finalizeContract(acceptanceMessage: { accepted: boolean; finalTerms: Record<string, any> }): { result: NegotiationResult; message: string } {
        if (this.currentState !== ContractState.REVIEWING && this.currentState !== ContractState.CONFLICT) {
            return { result: { status: "FAILURE", message: "Cannot finalize; negotiation is not in a review or conflict state." }, message: "Error" };
        }

        if (!acceptanceMessage.accepted) {
            this.currentState = ContractState.FAILED;
            return { result: { status: "FAILURE", message: "Finalization rejected by counterparty." }, message: "Failure" };
        }

        this.contractDetails.terms = { ...this.contractDetails.terms, ...acceptanceMessage.finalTerms };
        this.currentState = ContractState.AGREED;

        return {
            result: { status: "SUCCESS", message: "Contract successfully negotiated and agreed upon.", finalContract: this.contractDetails },
            message: "Contract finalized successfully."
        };
    }
}