import { Validator, PipelineExecutor } from "./pipeline-executor";

export class StructuredToolOutputValidationPipelineBuilderV123 {
    private validators: Validator[] = [];
    private conditionalValidators: { condition: (output: Record<string, unknown>) => boolean; validator: Validator }[] = [];

    constructor() {}

    public addValidator(validator: Validator): this {
        this.validators.push(validator);
        return this;
    }

    public addConditionalValidator(condition: (output: Record<string, unknown>) => boolean, validator: Validator): this {
        this.conditionalValidators.push({ condition, validator });
        return this;
    }

    public addCrossFieldValidator(validator: Validator): this {
        // For simplicity in this builder structure, we treat cross-field validators as standard validators
        // that operate on the full output context, assuming the validator implementation handles context access.
        this.validators.push(validator);
        return this;
    }

    public build(): PipelineExecutor {
        const allValidators: Validator[] = [...this.validators];
        const conditionalExecutors: ((output: Record<string, unknown>) => Validator[])[] = [];

        // Group conditional validators by their condition check, although in a real scenario,
        // we might need a more complex structure to manage execution order based on conditions.
        // For this builder, we will flatten them into a sequence that checks conditions sequentially.
        const sequentialConditionalValidators: Validator[] = [];
        for (const { condition, validator } of this.conditionalValidators) {
            // Wrap the conditional validator logic into a structure that the executor can handle sequentially
            // while respecting the condition check.
            const conditionalWrapper: Validator = {
                validate: (output: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
                    if (condition(output)) {
                        const result = validator.validate(output);
                        return { isValid: result.isValid, errors: result.errors };
                    }
                    return { isValid: true, errors: [] }; // Condition failed, so it passes validation for this step
                }
            };
            sequentialConditionalValidators.push(conditionalWrapper);
        }

        const finalValidators = [...allValidators, ...sequentialConditionalValidators];

        return new PipelineExecutor(finalValidators);
    }
}