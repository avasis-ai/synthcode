import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class StructuredThoughtStepValidatorV7 {
    private readonly requiredTemporalOrder: (step: Message, previous: Message) => boolean;
    private readonly requiredCausalLink: (current: Message, previous: Message) => boolean;

    constructor(
        temporalOrderCheck: (step: Message, previous: Message) => boolean,
        causalLinkCheck: (current: Message, previous: Message) => boolean
    ) {
        this.requiredTemporalOrder = temporalOrderCheck;
        this.requiredCausalLink = causalLinkCheck;
    }

    validate(steps: Message[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!steps || steps.length < 2) {
            return { isValid: true, errors: [] };
        }

        for (let i = 1; i < steps.length; i++) {
            const currentStep = steps[i];
            const previousStep = steps[i - 1];

            // 1. Temporal Consistency Check
            if (!this.requiredTemporalOrder(currentStep, previousStep)) {
                errors.push(`Temporal inconsistency detected between step ${i-1} and step ${i}. The sequence order is violated.`);
            }

            // 2. Causal Link Check
            if (!this.requiredCausalLink(currentStep, previousStep)) {
                errors.push(`Causal link failure detected between step ${i-1} and step ${i}. The current step does not appear to be sufficiently supported by the previous step.`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}