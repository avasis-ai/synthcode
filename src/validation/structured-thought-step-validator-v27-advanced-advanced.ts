import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StructuredThoughtStepValidator extends Validator<Message[]> {
    validateSequence(steps: Message[]): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV27AdvancedAdvanced implements StructuredThoughtStepValidator {
    validate(steps: Message[]): { isValid: boolean; errors: string[] } {
        if (!Array.isArray(steps) || steps.length === 0) {
            return { isValid: false, errors: ["Input must be a non-empty array of messages."] };
        }

        const errors: string[] = [];
        let previousThinkingContent: string | null = null;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            if (step.role === "user") {
                if (i > 0) {
                    // Basic check: User message should follow a response or tool result
                    const previousStep = steps[i - 1];
                    if (previousStep.role === "user") {
                        errors.push(`Step ${i}: User message immediately following another user message is unusual or invalid.`);
                    }
                }
            } else if (step.role === "assistant") {
                // Check for logical progression from previous thinking
                if (previousThinkingContent !== null) {
                    if (!step.content.some(block => block.type === "text" && block.text.includes("Based on the previous thought"))) {
                        errors.push(`Step ${i}: Assistant response should logically follow the previous thinking step.`);
                    }
                }
            } else if (step.role === "tool") {
                // Check for tool result following a tool use
                if (i > 0) {
                    const previousStep = steps[i - 1];
                    if (previousStep.role !== "assistant" || !Array.isArray((previousStep as any).content) || !(previousStep.content[0] as any).type === "tool_use") {
                        errors.push(`Step ${i}: Tool result must immediately follow an assistant message containing a tool use.`);
                    }
                }
            }

            // Cross-step dependency check (Simplified: Check for mandatory thinking before action)
            if (step.role === "assistant" && !step.content.some(block => block.type === "thinking")) {
                errors.push(`Step ${i}: Assistant message should ideally contain a <thinking> block for complex steps.`);
            }

            // Update state for the next iteration
            if (step.role === "thinking" || (step.role === "assistant" && step.content.some(block => block.type === "thinking"))) {
                const thinkingBlock = step.content.find((block: ContentBlock) => block.type === "thinking") as ThinkingBlock | undefined;
                if (thinkingBlock) {
                    previousThinkingContent = thinkingBlock.thinking;
                }
            } else if (step.role === "assistant" && step.content.length > 0) {
                // If no explicit thinking block, use the last text content as a fallback context
                const lastText = step.content.filter((block: ContentBlock) => block.type === "text").pop();
                if (lastText) {
                    previousThinkingContent = lastText.text;
                }
            } else {
                previousThinkingContent = null;
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateSequence(steps: Message[]): { isValid: boolean; errors: string[] } {
        return this.validate(steps);
    }
}

interface Validator<T> {
    validate(data: T): { isValid: boolean; errors: string[] };
}