import {
    Message,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock
} from "./types";

export type Constraint = {
    key: string;
    value: any;
    weight: number;
    description: string;
};

export interface NegotiationProposal {
    proposedConstraints: Constraint[];
    priorityRationale: string;
}

export interface NegotiationReport {
    isFeasible: boolean;
    acceptedConstraints: Constraint[];
    rejectionReason?: string;
}

export type PlanningContext = {
    messages: Message[];
    currentConstraints: Constraint[];
    // Add other context elements if necessary, e.g., plan: Plan;
};

interface SystemPolicyService {
    /**
     * Simulates interaction with an external system to validate and negotiate constraints.
     * @param proposal The constraints proposed by the agent.
     * @param currentContext The current planning context.
     * @returns A report detailing feasibility and accepted constraints.
     */
    validateAndNegotiate(proposal: NegotiationProposal, currentContext: PlanningContext): NegotiationReport;
}

class DynamicConstraintNegotiator {
    private policyService: SystemPolicyService;

    constructor(policyService: SystemPolicyService) {
        this.policyService = policyService;
    }

    negotiate(context: PlanningContext, proposal: NegotiationProposal): NegotiationReport {
        return this.policyService.validateAndNegotiate(proposal, context);
    }

    integrateConstraints(context: PlanningContext, report: NegotiationReport): PlanningContext {
        if (!report.isFeasible) {
            return {
                ...context,
                currentConstraints: [],
            };
        }

        const newConstraints = report.acceptedConstraints;

        return {
            ...context,
            currentConstraints: [...context.currentConstraints, ...newConstraints],
        };
    }
}

class MockSystemPolicyService implements SystemPolicyService {
    validateAndNegotiate(proposal: NegotiationProposal, currentContext: PlanningContext): NegotiationReport {
        console.log("--- Simulating Policy Service Validation ---");
        
        const accepted: Constraint[] = [];
        let feasible = true;
        let rejectionReason: string | undefined = undefined;

        for (const constraint of proposal.proposedConstraints) {
            if (constraint.weight > 0.7 && constraint.key.includes("latency")) {
                accepted.push(constraint);
            } else if (constraint.key.includes("cost") && constraint.weight < 0.3) {
                // Simulate rejection if cost constraint is too low
                feasible = false;
                rejectionReason = `Constraint '${constraint.key}' is too restrictive given current system policies.`;
                break;
            } else {
                accepted.push(constraint);
            }
        }

        if (!feasible) {
            return {
                isFeasible: false,
                acceptedConstraints: [],
                rejectionReason: rejectionReason,
            };
        }

        return {
            isFeasible: true,
            acceptedConstraints: accepted,
        };
    }
}

export {
    DynamicConstraintNegotiator,
    MockSystemPolicyService,
    Constraint,
    NegotiationProposal,
    NegotiationReport,
    PlanningContext
};