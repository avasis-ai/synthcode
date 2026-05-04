import { ValidatorBase, ValidationResult } from "./validator-base";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export class StructuredThoughtStepValidatorV8 extends ValidatorBase {
    validate(
        currentStep: Message,
        previousSteps: Message[]
    ): ValidationResult {
        if (!this.isValidMessage(currentStep)) {
            return { isValid: false, error: "Invalid message structure provided." };
        }

        if (previousSteps.length === 0) {
            return { isValid: true, message: "No previous steps to validate against." };
        }

        const previousStep = previousSteps[previousSteps.length - 1];

        if (currentStep.role === "user") {
            return { isValid: true, message: "User input validation passed." };
        }

        if (currentStep.role === "assistant") {
            return this.validateAssistantStep(currentStep, previousStep);
        }

        if (currentStep.role === "tool") {
            return this.validateToolResultMessage(currentStep, previousStep);
        }

        return { isValid: false, error: "Unsupported message role for validation." };
    }

    private validateAssistantStep(
        currentStep: Message,
        previousStep: Message
    ): ValidationResult {
        const assistantMessage = currentStep as { role: "assistant", content: ContentBlock[] };

        // Rule 1: If the previous step was a tool result, the current step must acknowledge it or continue the thought process.
        if (previousStep.role === "tool" && !this.hasToolAcknowledgement(assistantMessage.content, previousStep)) {
            return {
                isValid: false,
                error: "Assistant step must acknowledge the result of the preceding tool call."
            };
        }

        // Rule 2: If the current step contains a ToolUseBlock, the next step (if any) must be a tool result or a direct answer.
        const hasToolUse = assistantMessage.content.some(block => block.type === "tool_use");
        if (hasToolUse) {
            // This check is forward-looking, but we validate the current structure.
            // We ensure the tool use block is properly formed.
            for (const block of assistantMessage.content) {
                if (block.type === "tool_use") {
                    const toolUseBlock = block as ToolUseBlock;
                    if (!toolUseBlock.id || !toolUseBlock.name || typeof toolUseBlock.input !== 'object') {
                        return { isValid: false, error: "ToolUseBlock is malformed." };
                    }
                }
            }
        }

        // Rule 3: Check for logical flow consistency (e.g., thinking block must precede action/result).
        if (assistantMessage.content.some(block => block.type === "tool_use")) {
            const thinkingBlockBeforeToolUse = assistantMessage.content.some(block => {
                if (block.type === "thinking") {
                    // Check if the thinking block appears before the first tool use block
                    const index = assistantMessage.content.indexOf(block);
                    const firstToolUseIndex = assistantMessage.content.findIndex(b => b.type === "tool_use");
                    return index !== -1 && firstToolUseIndex !== -1 && index < firstToolUseIndex;
                }
                return false;
            });
            if (!thinkingBlockBeforeToolUse) {
                return { isValid: false, error: "Tool use must be preceded by a thinking block detailing the plan." };
            }
        }

        return { isValid: true, message: "Assistant step structure validated successfully." };
    }

    private validateToolResultMessage(
        currentStep: Message,
        previousStep: Message
    ): ValidationResult {
        const toolResultMessage = currentStep as { role: "tool", tool_use_id: string, content: string, is_error?: boolean };

        // Rule 1: A tool result must correspond to a tool use ID from the previous assistant step.
        if (!this.isToolIdReferenced(toolResultMessage.tool_use_id, previousStep)) {
            return {
                isValid: false,
                error: "ToolResultMessage tool_use_id does not match any tool use ID from the previous assistant step."
            };
        }

        // Rule 2: If the result is an error, the content must reflect the error nature.
        if (toolResultMessage.is_error === true && typeof toolResultMessage.content !== 'string') {
            return { isValid: false, error: "Error tool result requires a string content." };
        }

        return { isValid: true, message: "Tool result message validated successfully." };
    }

    private hasToolAcknowledgement(content: ContentBlock[], previousStep: Message): boolean {
        if (previousStep.role !== "tool") return true;

        const toolResult = previousStep as { role: "tool", tool_use_id: string, content: string };
        const requiredId = toolResult.tool_use_id;

        return content.some(block => {
            if (block.type === "text") {
                const textBlock = block as TextBlock;
                return textBlock.text.includes(requiredId) || textBlock.text.includes("result of tool");
            }
            return false;
        });
    }

    private isToolIdReferenced(toolId: string, previousStep: Message): boolean {
        if (previousStep.role !== "assistant") return false;

        const assistantMessage = previousStep as { role: "assistant", content: ContentBlock[] };
        return assistantMessage.content.some(block => {
            if (block.type === "tool_use") {
                const toolUseBlock = block as ToolUseBlock;
                return toolUseBlock.id === toolId;
            }
            return false;
        });
    }
}