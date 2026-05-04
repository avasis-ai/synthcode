import { ValidatorContext, ValidationResult } from "./validator-context";
import { Message, ContentBlock, ThinkingBlock } from "../types";

export class StructuredThoughtStepValidatorV6 {
    validate(
        steps: Message[],
        context: ValidatorContext
    ): ValidationResult {
        if (!steps || steps.length < 2) {
            return { isValid: true, errors: [] };
        }

        const errors: string[] = [];
        let previousThoughtId: string | null = null;

        for (let i = 1; i < steps.length; i++) {
            const currentStep = steps[i];
            const previousStep = steps[i - 1];

            if (currentStep.role === "assistant" && previousStep.role === "assistant") {
                const currentContentBlocks = (currentStep as any).content;
                const previousContentBlocks = (previousStep as any).content;

                let currentThoughtFound = false;
                let previousThoughtFound = false;

                // 1. Check for ThinkingBlock presence and dependency
                const currentThinkingBlock = currentContentBlocks?.find(
                    (block: any) => block.type === "thinking"
                ) as ThinkingBlock | undefined;

                if (currentThinkingBlock) {
                    currentThoughtFound = true;
                    // Simple heuristic: assume the previous thought must reference the previous step's output ID
                    // In a real system, this would require structured ID extraction.
                    if (previousStep.role === "tool" && !currentThinkingBlock.thinking.includes("acknowledging")) {
                        errors.push(
                            `Thought step at index ${i} must acknowledge the outcome of the previous tool result (index ${i-1}).`
                        );
                    }
                    // Simulate extracting an ID from the current thought for the next step
                    previousThoughtId = `thought_id_${i}_${currentStep.role}`;
                } else {
                    previousThoughtId = null;
                }

                // 2. Check for cross-step dependency (e.g., referencing a generated ID)
                if (previousStep.role === "tool" && !currentThinkingBlock) {
                    errors.push(
                        `Assistant step at index ${i} must contain a thinking block that processes the result from the tool step at index ${i-1}.`
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    }
}