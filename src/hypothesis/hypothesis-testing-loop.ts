import {
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    LoopEvent
} from "./types";

type Hypothesis = {
    id: string;
    statement: string;
    confidence: number;
};

type TestPlan = {
    toolName: string;
    input: Record<string, unknown>;
    expectedOutcome: string;
};

type RefinementStrategy = (
    currentHypothesis: Hypothesis,
    observation: string
) => {
    newHypothesis: Hypothesis | null;
    shouldContinue: boolean;
    reasoning: string;
};

type LoopState = "Pending" | "Testing" | "Observing" | "Refined" | "Failed";

export class HypothesisTestingLoop {
    private currentState: LoopState;
    private currentHypothesis: Hypothesis;
    private history: string[];

    constructor(initialHypothesis: Hypothesis) {
        this.currentHypothesis = initialHypothesis;
        this.currentState = "Pending";
        this.history = [];
    }

    public getState(): LoopState {
        return this.currentState;
    }

    public getCurrentHypothesis(): Hypothesis {
        return this.currentHypothesis;
    }

    public runTest(testPlan: TestPlan): string {
        if (this.currentState !== "Pending" && this.currentState !== "Refined") {
            throw new Error(`Cannot run test. Loop is in state: ${this.currentState}`);
        }

        this.currentState = "Testing";
        this.history.push(`--- Starting Test for Hypothesis: ${this.currentHypothesis.statement} ---`);

        // Simulate tool execution based on the plan
        const observation = `[Tool Result for ${testPlan.toolName}]: Successfully executed plan. Input was ${JSON.stringify(testPlan.input)}. Expected outcome was "${testPlan.expectedOutcome}". Actual result suggests ${testPlan.expectedOutcome.toLowerCase()} is plausible.`;

        this.history.push(`--- Test Completed. Observation Captured. ---`);
        return observation;
    }

    public observeAndRefine(
        observation: string,
        strategy: RefinementStrategy
    ): {
        newState: LoopState;
        newHypothesis: Hypothesis | null;
        continueTesting: boolean;
    } {
        if (this.currentState !== "Testing") {
            throw new Error(`Cannot observe. Loop must be in 'Testing' state.`);
        }

        this.currentState = "Observing";
        this.history.push(`--- Observing Observation: ${observation} ---`);

        const { newHypothesis, shouldContinue, reasoning } = strategy(
            this.currentHypothesis,
            observation
        );

        this.history.push(`--- Refinement Reasoning: ${reasoning} ---`);

        if (newHypothesis) {
            this.currentHypothesis = newHypothesis;
            this.currentState = "Refined";
        } else if (shouldContinue) {
            this.currentState = "Pending"; // Ready for next iteration
        } else {
            this.currentState = "Failed";
        }

        return {
            newState: this.currentState,
            newHypothesis: newHypothesis,
            continueTesting: shouldContinue
        };
    }

    public getHistory(): string[] {
        return this.history;
    }
}