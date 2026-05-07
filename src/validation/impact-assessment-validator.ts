import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    Message,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

export interface ResourceConstraints {
    maxMemoryGB: number;
    maxApiCalls: number;
    availableBudget: number;
}

export interface ProposedAction {
    toolName: string;
    input: Record<string, unknown>;
    description: string;
}

export interface ImpactAssessmentContext {
    currentState: Message[];
    constraints: ResourceConstraints;
    proposedAction: ProposedAction;
}

export interface ImpactConflict {
    serviceName: string;
    severity: "low" | "medium" | "high";
    conflictDescription: string;
    suggestedMitigation: string;
}

export interface ImpactReport {
    isSafe: boolean;
    conflicts: ImpactConflict[];
    summary: string;
}

export interface ImpactService {
    name: string;
    validate(context: ImpactAssessmentContext): ImpactConflict | null;
}

export class ImpactAssessmentValidator {
    private services: ImpactService[];

    constructor(services: ImpactService[]) {
        this.services = services;
    }

    public validate(context: ImpactAssessmentContext): ImpactReport {
        const conflicts: ImpactConflict[] = [];

        for (const service of this.services) {
            const conflict = service.validate(context);
            if (conflict) {
                conflicts.push(conflict);
            }
        }

        const isSafe = conflicts.length === 0;
        let summary: string;

        if (isSafe) {
            summary = "Impact assessment passed. No critical conflicts detected.";
        } else {
            summary = `Impact assessment detected ${conflicts.length} potential conflict(s). Review the report for details.`;
        }

        return {
            isSafe: isSafe,
            conflicts: conflicts,
            summary: summary,
        };
    }
}