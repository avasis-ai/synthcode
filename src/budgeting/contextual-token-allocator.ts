interface Message {
    role: "user" | "assistant" | "tool";
    content: any;
}

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: ContentBlock[];
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

export interface Step {
    description: string;
    inputTokens: number;
    outputTokens: number;
}

export interface AllocationResult {
    stepDescription: string;
    allocatedInput: number;
    allocatedOutput: number;
    cumulativeCost: number;
    remainingBudget: number;
    isOverrun: boolean;
}

export class ContextualTokenAllocator {
    /**
     * Analyzes a planned sequence of steps and allocates a total token budget.
     * @param steps The sequence of steps to analyze.
     * @param totalBudget The total token budget available for the sequence.
     * @returns A detailed allocation map for each step.
     */
    allocate(steps: Step[], totalBudget: number): AllocationResult[] {
        if (!steps || steps.length === 0) {
            return [];
        }

        const results: AllocationResult[] = [];
        let currentBudget = totalBudget;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepResult: AllocationResult = {
                stepDescription: step.description,
                allocatedInput: 0,
                allocatedOutput: 0,
                cumulativeCost: 0,
                remainingBudget: currentBudget,
                isOverrun: false,
            };

            // Calculate the required cost for this step
            const requiredCost = step.inputTokens + step.outputTokens;

            // Determine allocation based on remaining budget
            let allocatedInput = Math.min(step.inputTokens, currentBudget);
            let allocatedOutput = Math.min(step.outputTokens, currentBudget - allocatedInput);

            // Handle potential over-allocation if the total required cost exceeds the budget
            if (requiredCost > currentBudget) {
                // Scale down allocation proportionally if budget is insufficient
                const scaleFactor = currentBudget / requiredCost;
                allocatedInput = Math.floor(step.inputTokens * scaleFactor);
                allocatedOutput = Math.floor(step.outputTokens * scaleFactor);
            } else {
                allocatedInput = step.inputTokens;
                allocatedOutput = step.outputTokens;
            }

            const actualCost = allocatedInput + allocatedOutput;
            const newRemainingBudget = currentBudget - actualCost;

            stepResult.allocatedInput = allocatedInput;
            stepResult.allocatedOutput = allocatedOutput;
            stepResult.cumulativeCost = actualCost;
            stepResult.remainingBudget = newRemainingBudget;
            stepResult.isOverrun = newRemainingBudget < 0;

            results.push(stepResult);
            currentBudget = newRemainingBudget;
        }

        return results;
    }
}

export { ContextualTokenAllocator };