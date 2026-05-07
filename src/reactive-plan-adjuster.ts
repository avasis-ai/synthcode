import { EventEmitter } from 'events';

export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
    tool_use_id?: string;
    is_error?: boolean;
};

export interface JobContext {
    jobId: string;
    currentStep: string;
    history: Message[];
    resourceStatus: Record<string, 'ok' | 'degraded' | 'critical'>;
}

export type PlanAdjustmentAction = 'RETRY_BACKOFF' | 'SWITCH_TOOL' | 'ASK_CLARIFICATION' | 'CONTINUE';

export interface PlanAdjustment {
    action: PlanAdjustmentAction;
    confidence: number;
    rationale: string;
}

export interface AdjustmentRule {
    triggerCondition: (event: Message, context: JobContext) => boolean;
    adjustmentGenerator: (event: Message, context: JobContext) => PlanAdjustment;
}

export class ReactivePlanAdjuster extends EventEmitter {
    private rules: AdjustmentRule[];

    constructor(initialRules: AdjustmentRule[]) {
        super();
        this.rules = initialRules;
    }

    public subscribeToStream(eventSource: EventEmitter): void {
        eventSource.on('event', (event: Message) => {
            const context: JobContext = {
                jobId: 'job-123',
                currentStep: 'processing',
                history: [],
                resourceStatus: {}
            };
            const adjustment = this.processEvent(event, context);
            this.emit('adjustment_suggested', adjustment);
        });
    }

    private processEvent(event: Message, context: JobContext): PlanAdjustment {
        let bestAdjustment: PlanAdjustment | null = null;
        let highestConfidence = -1;

        for (const rule of this.rules) {
            if (rule.triggerCondition(event, context)) {
                const adjustment = rule.adjustmentGenerator(event, context);
                
                if (adjustment.confidence > highestConfidence) {
                    highestConfidence = adjustment.confidence;
                    bestAdjustment = adjustment;
                }
            }
        }

        if (!bestAdjustment) {
            return {
                action: 'CONTINUE',
                confidence: 0.1,
                rationale: 'No specific adjustment rule matched the incoming event.'
            };
        }

        return bestAdjustment;
    }

    public addRule(rule: AdjustmentRule): void {
        this.rules.push(rule);
    }
}