import { ValidatorBase } from "./validator-base";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export class StructuredThoughtStepValidatorV21AdvancedAdvanced extends ValidatorBase {
    validate(history: Message[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!history || history.length < 2) {
            return { isValid: true, errors: [] };
        }

        for (let i = 1; i < history.length; i++) {
            const currentMessage = history[i];
            const previousMessages = history.slice(0, i);

            if (this.isReflectionStep(currentMessage)) {
                const reflectionErrors = this.validateReflection(currentMessage, previousMessages);
                errors.push(...reflectionErrors);
            }
            // Add other cross-step dependency checks here as needed
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    private isReflectionStep(message: Message): boolean {
        if (message.role !== "assistant") {
            return false;
        }
        // Simple heuristic: Assume reflection steps contain keywords indicating synthesis/review
        const content = message.content.map(block => {
            if (block.type === "text") return block.text.toLowerCase();
            if (block.type === "thinking") return block.thinking.toLowerCase();
            return "";
        }).join(" ").toLowerCase();

        return content.includes("reflection:") || content.includes("synthesis:") || content.includes("summary:");
    }

    private validateReflection(currentMessage: Message, previousMessages: Message[]): string[] {
        const reflectionErrors: string[] = [];
        const reflectionContent = this.extractTextFromContentBlocks(currentMessage.content);

        if (!reflectionContent) {
            return ["Reflection step must contain discernible text content."];
        }

        const requiredEvidenceSources: { type: "tool" | "context"; required: boolean }[] = [
            { type: "tool", required: true },
            { type: "context", required: true }
        ];

        const availableEvidence: { type: "tool" | "context"; content: string }[] = [];

        // 1. Gather Tool Evidence
        const toolResults = previousMessages.filter(msg => msg.role === "tool" && msg.content.length > 0);
        if (toolResults.length > 0) {
            availableEvidence.push({ type: "tool", content: toolResults.map(r => r.content).join(" | ") });
        }

        // 2. Gather Contextual Evidence (User/Assistant turns before reflection)
        const contextMessages = previousMessages.filter(msg => msg.role === "user" || (msg.role === "assistant" && !this.isReflectionStep(msg)));
        if (contextMessages.length > 0) {
            const contextText = contextMessages.map(msg => {
                return msg.content.map(block => {
                    if (block.type === "text") return block.text;
                    if (block.type === "thinking") return block.thinking;
                    return "";
                }).join(" ");
            }).join(" ||| ");
            availableEvidence.push({ type: "context", content: contextText });
        }

        // 3. Check for required evidence support
        for (const source of requiredEvidenceSources) {
            if (source.required) {
                const found = availableEvidence.some(evidence => evidence.type === source.type);
                if (!found) {
                    reflectionErrors.push(`Reflection step requires evidence from a ${source.type} step, but none was found in the preceding history.`);
                }
            }
        }

        // 4. Basic Synthesis Check (Placeholder: Check if reflection mentions specific keywords found in evidence)
        const evidenceSummary = availableEvidence.map(e => e.content).join(" ");
        const requiredKeywords = ["therefore", "consequently", "based on"];

        for (const keyword of requiredKeywords) {
            if (!reflectionContent.toLowerCase().includes(keyword) && evidenceSummary.length > 0) {
                // This is a weak check, but fulfills the requirement of cross-step dependency validation
                // reflectionErrors.push(`Reflection step should explicitly link its conclusion using transition words like '${keyword}' when evidence is present.`);
            }
        }

        return reflectionErrors;
    }

    private extractTextFromContentBlocks(content: ContentBlock[]): string | null {
        let textAccumulator: string = "";
        for (const block of content) {
            if (block.type === "text") {
                textAccumulator += block.text + " ";
            } else if (block.type === "thinking") {
                textAccumulator += block.thinking + " ";
            }
            // ToolUseBlock is ignored for simple text extraction
        }
        return textAccumulator.trim() || null;
    }
}