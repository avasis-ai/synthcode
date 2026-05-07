import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: TextBlock[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: TextBlock[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
    | { type: "text"; text: string }
    | { type: "thinking"; thinking: string }
    | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface FeedbackPayload {
    urgency: number;
    cost_modifier: number;
    impact_score: number;
    source: string;
    details: Record<string, unknown>;
}

export interface PlanAdaptationContext {
    currentPlan: ToolUseBlock[];
    targetGoal: string;
    feedback: FeedbackPayload;
}

export interface RevisedStep {
    actionName: string;
    description: string;
    priorityScore: number;
    estimatedCost: number;
}

export class PlanAdaptationEngine {
    private readonly scoringWeight: Record<string, number>;

    constructor(scoringWeight: Record<string, number> = {
        goalAlignment: 0.5,
        feasibility: 0.3,
        costEfficiency: 0.2
    }) {
        this.scoringWeight = scoringWeight;
    }

    private calculateStepScore(step: ToolUseBlock, context: PlanAdaptationContext): number {
        const { targetGoal, feedback } = context;

        // 1. Goal Alignment Score (How well does this step move towards the goal?)
        const goalAlignment = Math.min(1, step.name.length / 5 + Math.random() * 0.1);

        // 2. Feasibility Score (Does the feedback suggest this step is now impossible/risky?)
        let feasibility = 1.0;
        if (feedback.impact_score < 0.2 && step.name.includes("critical")) {
            feasibility = 0.1;
        } else if (feedback.urgency > 0.8) {
            feasibility = 0.9;
        }

        // 3. Cost Efficiency Score (Adjusted by feedback cost modifier)
        const baseCost = Object.keys(step.input).length * 10;
        const costEfficiency = Math.max(0.1, 1 - (feedback.cost_modifier * 0.5));

        // Weighted average calculation
        const score = (goalAlignment * this.scoringWeight.goalAlignment) +
                      (feasibility * this.scoringWeight.feasibility) +
                      (costEfficiency * this.scoringWeight.costEfficiency);

        return score;
    }

    public refinePlan(context: PlanAdaptationContext): RevisedStep[] {
        const potentialSteps: ToolUseBlock[] = context.currentPlan;
        const revisedSteps: RevisedStep[] = [];

        for (const step of potentialSteps) {
            const score = this.calculateStepScore(step, context);
            const revisedStep: RevisedStep = {
                actionName: step.name,
                description: `Executing ${step.name} based on goal: ${context.targetGoal}.`,
                priorityScore: parseFloat(score.toFixed(4)),
                estimatedCost: Math.round(100 * (1 - context.feedback.cost_modifier)),
            };
            revisedSteps.push(revisedStep);
        }

        // Sort and return the prioritized plan
        return revisedSteps.sort((a, b) => b.priorityScore - a.priorityScore);
    }
}