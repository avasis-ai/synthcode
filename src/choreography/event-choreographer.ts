import { EventEmitter } from "events";

type Message = { type: string; payload: any };

interface ChoreographyRule {
    startEvent: string;
    sequence: {
        waitFor: string;
        action?: (event: Message, state: ChoreographyState) => Promise<void>;
        onFailure?: (state: ChoreographyState) => Promise<void>;
    }[];
}

interface ChoreographyState {
    ruleId: string;
    currentStepIndex: number;
    context: Record<string, any>;
    startTime: number;
}

class MessageBus extends EventEmitter {
    static getInstance(): MessageBus {
        if (!MessageBus.instance) {
            MessageBus.instance = new MessageBus();
        }
        return MessageBus.instance;
    }
}
MessageBus.instance = new MessageBus();

class EventChoreographer {
    private activeChoreographies: Map<string, ChoreographyState> = new Map();
    private rules: Map<string, ChoreographyRule> = new Map();

    constructor() {
        this.initializeBus();
    }

    private initializeBus(): void {
        MessageBus.getInstance().on("event", async (message: Message) => {
            await this.handleIncomingEvent(message);
        });
    }

    public registerRule(ruleId: string, rule: ChoreographyRule): void {
        this.rules.set(ruleId, rule);
    }

    public startChoreography(ruleId: string, initialContext: Record<string, any>): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            throw new Error(`Choreography rule ${ruleId} not found.`);
        }

        const state: ChoreographyState = {
            ruleId: ruleId,
            currentStepIndex: 0,
            context: initialContext,
            startTime: Date.now(),
        };

        this.activeChoreographies.set(ruleId, state);
        
        // Trigger the first step immediately
        return this.executeStep(state, initialContext);
    }

    private async handleIncomingEvent(event: Message): Promise<void> {
        for (const [ruleId, state] of this.activeChoreographies.entries()) {
            const rule = this.rules.get(ruleId);
            if (!rule) continue;

            const expectedEvent = rule.sequence[state.currentStepIndex]?.waitFor;

            if (expectedEvent && expectedEvent === event.type) {
                console.log(`[Choreographer] Event received: ${event.type}. Advancing state for ${ruleId}.`);
                await this.executeStep(state, event.payload);
            }
        }
    }

    private async executeStep(state: ChoreographyState, eventPayload: any): Promise<void> {
        const rule = this.rules.get(state.ruleId)!;
        const step = rule.sequence[state.currentStepIndex];

        if (!step) {
            console.log(`[Choreographer] Choreography ${state.ruleId} completed successfully.`);
            this.activeChoreographies.delete(state.ruleId);
            return;
        }

        try {
            // 1. Execute action if defined
            if (step.action) {
                await step.action(eventPayload, state);
            }

            // 2. Advance state
            state.currentStepIndex++;
            this.activeChoreographies.set(state.ruleId, state);

        } catch (error) {
            console.error(`[Choreographer] Failure in step ${state.currentStepIndex} for ${state.ruleId}. Initiating compensation.`);
            await this.compensate(state);
            this.activeChoreographies.delete(state.ruleId);
        }
    }

    private async compensate(state: ChoreographyState): Promise<void> {
        const rule = this.rules.get(state.ruleId)!;
        const failedStep = rule.sequence[state.currentStepIndex];

        if (failedStep && failedStep.onFailure) {
            await failedStep.onFailure(state);
        } else {
            console.warn(`[Choreographer] No compensation defined for ${state.ruleId} at step ${state.currentStepIndex}.`);
        }
    }
}

export { EventChoreographer, MessageBus };