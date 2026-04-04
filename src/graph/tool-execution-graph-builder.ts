import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GraphStep = {
    toolName: string;
    inputMapper: (context: Record<string, unknown>) => Record<string, unknown>;
    nextSteps?: string[];
};

export type FallbackCondition = (context: Record<string, unknown>) => boolean;

export type FallbackStep = {
    condition: FallbackCondition;
    fallbackStep: {
        toolName: string;
        inputMapper: (context: Record<string, unknown>) => Record<string, unknown>;
    };
};

export interface ExecutionGraph {
    initialStep: GraphStep;
    fallbacks: FallbackStep[];
    // In a real implementation, this would hold the entire structure
}

export class ToolExecutionGraphBuilder {
    private initialStep: GraphStep | null = null;
    private fallbacks: FallbackStep[] = [];

    constructor() {}

    public addStep(toolName: string, inputMapper: (context: Record<string, unknown>) => Record<string, unknown>): this {
        if (this.initialStep === null) {
            this.initialStep = { toolName, inputMapper };
        } else {
            // For simplicity in this builder, we assume subsequent calls define the *next* potential step
            // In a real graph, this would require explicit linking. Here, we just overwrite/append conceptually.
            // For this implementation, we'll treat subsequent calls as defining the primary path if no explicit linking is done.
            // A robust builder would require a 'linkTo' mechanism.
            this.initialStep = { toolName, inputMapper };
        }
        return this;
    }

    public addFallback(condition: FallbackCondition, fallbackStep: { toolName: string; inputMapper: (context: Record<string, unknown>) => Record<string, unknown> }): this {
        this.fallbacks.push({ condition, fallbackStep });
        return this;
    }

    public build(): ExecutionGraph {
        if (!this.initialStep) {
            throw new Error("Graph construction failed: Must call addStep at least once to define an initial step.");
        }

        // Validation logic can be expanded here (e.g., checking for circular dependencies, etc.)

        return {
            initialStep: this.initialStep,
            fallbacks: this.fallbacks,
        };
    }
}