import { EventEmitter } from "events";

export type Message = any;

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
    type: "text";
    text: string;
}

export interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

export type LoopEvent = any;

export interface StateDelta {
    key: string;
    newValue: any;
    oldValue?: any;
}

export interface CausalEvent {
    timestamp: number;
    payload: Message;
    triggeringRuleId: string;
    stateDelta: StateDelta;
}

export interface CausalStep {
    event: CausalEvent;
    description: string;
    impact: string;
}

export class CausalChain {
    private steps: CausalStep[] = [];
    private finalState: Record<string, any> = {};

    public addStep(event: CausalEvent, description: string, impact: string): void {
        const step: CausalStep = { event, description, impact };
        this.steps.push(step);
        this.updateState(event.stateDelta);
    }

    private updateState(delta: StateDelta): void {
        if (delta.key) {
            this.finalState[delta.key] = delta.newValue;
        }
    }

    public getSteps(): ReadonlyArray<CausalStep> {
        return this.steps;
    }

    public getFinalState(): Readonly<Record<string, any>> {
        return this.finalState;
    }

    public generateNarrativeReport(): string {
        let report = "--- Causal Chain Report ---\n";
        report += `Total Steps: ${this.steps.length}\n`;
        report += `Final State Snapshot: ${JSON.stringify(this.finalState, null, 2)}\n\n`;

        this.steps.forEach((step, index) => {
            report += `[Step ${index + 1}] Initiating Event: ${JSON.stringify(step.event.payload)}\n`;
            report += `  -> Cause: ${step.description}\n`;
            report += `  -> Effect: ${step.impact}\n`;
            report += `  -> State Change: ${JSON.stringify(step.event.stateDelta)}\n`;
        });

        report += "\n---------------------------\n";
        return report;
    }

    public identifyRootCause(failureEvent: CausalEvent): string {
        const lastStep = this.steps.find(step => step.event.timestamp === failureEvent.timestamp);
        if (!lastStep) {
            return "Root cause could not be determined from the recorded chain.";
        }
        return `The failure observed at this step was primarily governed by Rule ID: ${failureEvent.triggeringRuleId}. The immediate cause was the event payload: ${JSON.stringify(failureEvent.payload)}.`;
    }
}

export class CausalEventStreamProcessor {
    private eventBus: EventEmitter;
    private currentChain: CausalChain = new CausalChain();
    private buffer: CausalEvent[] = [];

    constructor(eventBus: EventEmitter) {
        this.eventBus = eventBus;
        this.eventBus.on("raw_event", this.handleRawEvent.bind(this));
    }

    private handleRawEvent(event: CausalEvent): void {
        this.buffer.push(event);
        this.processEvent(event);
    }

    private processEvent(event: CausalEvent): void {
        const description = `Event triggered by rule ${event.triggeringRuleId}.`;
        const impact = `State mutated: ${event.stateDelta.key} changed to ${JSON.stringify(event.stateDelta.newValue)}.`;

        this.currentChain.addStep(event, description, impact);
    }

    public getCausalChain(): CausalChain {
        return this.currentChain;
    }

    public resetChain(): void {
        this.currentChain = new CausalChain();
        this.buffer = [];
    }
}