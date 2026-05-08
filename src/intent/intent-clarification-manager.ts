import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface IntentContext {
    history: Message[];
    currentParameters: Record<string, any>;
    requiredParameters: string[];
}

export interface AmbiguityReport {
    missingParameters: string[];
    conflicts: string[];
    confidenceScore: number;
}

export class IntentClarificationManager {
    private context: IntentContext;

    constructor(initialContext: IntentContext) {
        this.context = initialContext;
    }

    detectAmbiguity(context: IntentContext): AmbiguityReport {
        const missingParameters: string[] = [];
        const conflicts: string[] = [];
        let score = 1.0;

        for (const param of context.requiredParameters) {
            if (!(param in context.currentParameters) || context.currentParameters[param] === null) {
                missingParameters.push(param);
            }
        }

        // Simple conflict detection placeholder
        if (context.history.length > 0) {
            const lastUserMessage = context.history[context.history.length - 1] as UserMessage;
            if (lastUserMessage.content.toLowerCase().includes("cancel") && context.currentParameters.action) {
                conflicts.push("Cancellation detected while action was set.");
                score *= 0.5;
            }
        }

        return {
            missingParameters,
            conflicts,
            confidenceScore: Math.max(0.1, score * (1 - missingParameters.length * 0.1)),
        };
    }

    generateClarificationQuestions(report: AmbiguityReport): TextBlock[] {
        let questions: string[] = [];

        if (report.missingParameters.length > 0) {
            const paramsList = report.missingParameters.map(p => p.replace(/([A-Z])/g, ' $1').trim()).join(", ");
            questions.push(`I need a little more information to proceed. Could you clarify the following details: ${paramsList}?`);
        }

        if (report.conflicts.length > 0) {
            questions.push(`I noticed a potential conflict in your request: ${report.conflicts.join(' ')}. Could you confirm your preferred goal?`);
        }

        if (questions.length === 0) {
            return [{ type: "text", text: "No clarification needed." }];
        }

        return questions.map(q => ({ type: "text", text: q }));
    }

    resolveClarificationLoop(userResponse: string): { resolved: boolean; newContext: IntentContext } {
        const newContext: IntentContext = {
            ...this.context,
            history: [...this.context.history, { role: "user", content: userResponse }]
        };

        // Simulate parameter extraction and update
        const updatedParams: Record<string, any> = { ...this.context.currentParameters };
        
        if (userResponse.toLowerCase().includes("yes") || userResponse.toLowerCase().includes("confirm")) {
            updatedParams.confirmation = true;
        } else if (userResponse.toLowerCase().includes("no") || userResponse.toLowerCase().includes("cancel")) {
            updatedParams.confirmation = false;
        }

        // Simple check: if we have enough parameters, assume resolution
        const required = newContext.requiredParameters;
        const resolvedCount = required.filter(p => updatedParams[p] !== undefined && updatedParams[p] !== null).length;

        const resolved = resolvedCount >= required.length * 0.8;

        return {
            resolved: resolved,
            newContext: {
                ...newContext,
                currentParameters: updatedParams
            }
        };
    }

    async manage(userMessage: UserMessage): Promise<{ clarificationNeeded: boolean; responseBlocks: ContentBlock[]; updatedContext: IntentContext }> {
        const report = this.detectAmbiguity(this.context);

        if (report.confidenceScore < 0.7 || report.missingParameters.length > 0) {
            const clarificationQuestions = this.generateClarificationQuestions(report);
            
            return {
                clarificationNeeded: true,
                responseBlocks: clarificationQuestions,
                updatedContext: this.context
            };
        }

        // If not ambiguous, process the message and update context
        const { resolved: isResolved, newContext } = this.resolveClarificationLoop(userMessage.content);
        
        if (isResolved) {
            return {
                clarificationNeeded: false,
                responseBlocks: [{ type: "thinking", thinking: "Intent resolved. Proceeding to planning." }],
                updatedContext: newContext
            };
        }

        return {
            clarificationNeeded: false,
            responseBlocks: [{ type: "thinking", thinking: "Intent understood. Proceeding to planning." }],
            updatedContext: this.context
        };
    }
}