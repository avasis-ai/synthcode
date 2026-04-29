import { PipelineBuilder } from "./pipeline-builder-base";

export class StructuredToolOutputValidationPipelineBuilderV115 extends PipelineBuilder {
    private temporalValidators: (() => boolean)[] = [];
    private crossFieldValidators: ((data: Record<string, unknown>) => boolean)[] = [];

    addTemporalValidatorStep(validator: (() => boolean)): this {
        this.temporalValidators.push(validator);
        return this;
    }

    addCrossFieldValidatorStep(validator: (data: Record<string, unknown>) => boolean): this {
        this.crossFieldValidators.push(validator);
        return this;
    }

    build(): ValidationPipeline {
        const pipeline: ValidationPipeline = {
            validate: async (data: Record<string, unknown>): Promise<boolean> => {
                // 1. Base Schema Validation (Assumed to be handled by parent builder or initial steps)
                // For this specific builder, we focus on adding specialized steps.

                // 2. Execute Temporal Validators
                for (const validator of this.temporalValidators) {
                    if (!validator()) {
                        return false;
                    }
                }

                // 3. Execute Cross-Field Validators
                for (const validator of this.crossFieldValidators) {
                    if (!validator(data)) {
                        return false;
                    }
                }

                return true;
            }
        };

        return pipeline;
    }
}