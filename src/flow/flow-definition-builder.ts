import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Condition {
    key: string;
    operator: "==" | "!=" | "<" | ">" | "<=" | ">=";
    value: unknown;
}

interface FlowStep {
    id: string;
    description: string;
    action: "call_tool" | "execute_logic" | "wait";
    inputs: Record<string, unknown>;
    conditions: Condition[];
    nextSteps: {
        condition?: Condition;
        stepId: string;
    }[];
    parallelBranches?: {
        stepId: string;
        condition?: Condition;
    }[];
}

interface FlowDefinition {
    id: string;
    steps: Record<string, FlowStep>;
    startStepId: string;
}

export class FlowDefinitionBuilder {
    private flowId: string;
    private steps: Map<string, FlowStep> = new Map();
    private startStepId: string = "";

    constructor(flowId: string) {
        this.flowId = flowId;
    }

    private generateStepId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    public addStep(description: string, action: "call_tool" | "execute_logic" | "wait", inputs: Record<string, unknown>): this {
        const stepId = this.generateStepId("step");
        const step: FlowStep = {
            id: stepId,
            description: description,
            action: action,
            inputs: inputs,
            conditions: [],
            nextSteps: [],
        };
        this.steps.set(stepId, step);
        return this;
    }

    public addConditionalBranch(
        sourceStepId: string,
        condition: Condition,
        description: string,
        action: "call_tool" | "execute_logic" | "wait",
        inputs: Record<string, unknown>
    ): this {
        const stepId = this.generateStepId("cond");
        const step: FlowStep = {
            id: stepId,
            description: description,
            action: action,
            inputs: inputs,
            conditions: [condition],
            nextSteps: [],
        };
        this.steps.set(stepId, step);

        const sourceStep = this.steps.get(sourceStepId);
        if (sourceStep) {
            sourceStep.nextSteps.push({ condition: condition, stepId: stepId });
        }

        return this;
    }

    public addParallelBranch(
        sourceStepId: string,
        branchId: string,
        description: string,
        action: "call_tool" | "execute_logic" | "wait",
        inputs: Record<string, unknown>
    ): this {
        const stepId = this.generateStepId("par");
        const step: FlowStep = {
            id: stepId,
            description: description,
            action: action,
            inputs: inputs,
            conditions: [],
            nextSteps: [],
        };
        this.steps.set(stepId, step);

        const sourceStep = this.steps.get(sourceStepId);
        if (sourceStep) {
            if (!sourceStep.parallelBranches) {
                sourceStep.parallelBranches = [];
            }
            sourceStep.parallelBranches.push({ stepId: stepId });
        }

        return this;
    }

    public setStartStep(stepId: string): this {
        if (!this.steps.has(stepId)) {
            throw new Error(`Step ID ${stepId} not found in the flow.`);
        }
        this.startStepId = stepId;
        return this;
    }

    public build(): FlowDefinition {
        const stepsArray: FlowStep[] = Array.from(this.steps.values());

        // Basic validation check
        if (!this.startStepId) {
            throw new Error("Flow definition must have a starting step set using setStartStep().");
        }

        // In a real scenario, deep graph validation (cycles, missing inputs) would occur here.
        // For this implementation, we assume the builder methods ensure basic structural integrity.

        return {
            id: this.flowId,
            steps: Object.fromEntries(this.steps),
            startStepId: this.startStepId,
        };
    }
}