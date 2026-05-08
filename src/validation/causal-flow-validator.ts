export type PlanStep = {
    name: string;
    description: string;
    requiredInputs: Record<string, {
        source: 'context' | 'previous_step';
        required: boolean;
        type: string;
    }>;
    guaranteedOutputs: Record<string, string>;
};

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};

export class CausalFlowValidator {

    validate(planSteps: PlanStep[]): ValidationResult {
        const errors: string[] = [];
        const guaranteedOutputs: Record<string, string> = {};

        for (let i = 0; i < planSteps.length; i++) {
            const step = planSteps[i];
            const stepErrors: string[] = [];

            for (const inputName in step.requiredInputs) {
                const inputMeta = step.requiredInputs[inputName];

                if (!inputMeta.required) {
                    continue;
                }

                let isAvailable = false;

                if (inputMeta.source === 'context') {
                    // Assuming context availability check is simplified here
                    // In a real system, we'd check the initial context object.
                    // For this validator, we assume 'context' means it must be provided externally.
                    // Since we don't have the context object, we assume if it's required, it must be present.
                    // We'll simulate a check for demonstration.
                    if (inputName.toLowerCase().includes('initial')) {
                        isAvailable = true;
                    }
                } else if (inputMeta.source === 'previous_step') {
                    // Check if a previous step guaranteed this output
                    const previousStep = planSteps[i - 1];
                    if (previousStep && previousStep.guaranteedOutputs[inputName]) {
                        isAvailable = true;
                    }
                }

                if (!isAvailable) {
                    stepErrors.push(`Causal Gap: Input '${inputName}' required by step '${step.name}' is missing. Source required: ${inputMeta.source}.`);
                }
            }

            if (stepErrors.length > 0) {
                errors.push(`Step ${i + 1} (${step.name}) failed validation: ${stepErrors.join('; ')}`);
            }

            // Update guaranteed outputs for the next step
            Object.assign(guaranteedOutputs, step.guaranteedOutputs);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

export { CausalFlowValidator };