export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export interface ComplexityBudget {
    maxDepth: number;
    maxNesting: number;
    maxSteps: number;
}

export class ComplexityViolation extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ComplexityViolation";
    }
}

export interface ValidationContext {
    blocks: ContentBlock[];
    currentStep: number;
}

export class ComplexityBudgetValidator {
    private budget: ComplexityBudget;

    constructor(budget: ComplexityBudget) {
        this.budget = budget;
    }

    private checkDepth(currentDepth: number): void {
        if (currentDepth > this.budget.maxDepth) {
            throw new ComplexityViolation(
                `Exceeded maximum structural depth. Current depth: ${currentDepth}, Max allowed: ${this.budget.maxDepth}`
            );
        }
    }

    private checkNesting(currentNesting: number): void {
        if (currentNesting > this.budget.maxNesting) {
            throw new ComplexityViolation(
                `Exceeded maximum nesting level. Current nesting: ${currentNesting}, Max allowed: ${this.budget.maxNesting}`
            );
        }
    }

    private validateBlocks(blocks: ContentBlock[], context: ValidationContext, currentDepth: number, currentNesting: number): void {
        if (context.currentStep >= this.budget.maxSteps) {
            throw new ComplexityViolation(
                `Exceeded maximum total steps allowed. Current step: ${context.currentStep}, Max allowed: ${this.budget.maxSteps}`
            );
        }

        for (const block of blocks) {
            this.checkDepth(currentDepth);
            this.checkNesting(currentNesting);

            if (block.type === "tool_use") {
                // Simulate complex traversal/nested calls within a tool use block
                this.validateBlocks(
                    [], // No further blocks in this simplified model
                    { blocks: [], currentStep: context.currentStep + 1 },
                    currentDepth + 1,
                    currentNesting + 1
                );
            }
        }
    }

    validate(context: ValidationContext): void {
        let currentDepth = 0;
        let currentNesting = 0;

        if (!context || !context.blocks) {
            return;
        }

        this.validateBlocks(context.blocks, context, currentDepth, currentNesting);
    }
}

export {
    ComplexityBudgetValidator,
    ComplexityViolation,
    ComplexityBudget
}