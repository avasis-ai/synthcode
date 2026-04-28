import { Message, ToolResultMessage } from "./message-types";

type Validator<T> = (data: T) => { isValid: boolean; errors: string[] };
type Constraint<T> = (data: T) => { isValid: boolean; errors: string[] };

interface ValidationPipeline<T> {
    validate: (data: T) => { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputValidationPipelineBuilder {
    private targetSchema: Record<string, any>;
    private validators: Validator<any>[] = [];
    private constraints: Constraint<any>[] = [];

    constructor(targetSchema: Record<string, any>) {
        this.targetSchema = targetSchema;
    }

    addStep(validator: Validator<any>): this {
        this.validators.push(validator);
        return this;
    }

    addConstraint(constraint: Constraint<any>): this {
        this.constraints.push(constraint);
        return this;
    }

    build<T>(): ValidationPipeline<T> {
        const pipeline: ValidationPipeline<T> = {
            validate: (data: T): { isValid: boolean; errors: string[] } => {
                let allErrors: string[] = [];
                let isValid = true;

                // 1. Schema Validation (Simplified: assumes basic structure check)
                // In a real scenario, this would use a library like Zod or Yup.
                // Here, we just check if the data structure roughly matches the schema keys.
                if (typeof data !== 'object' || data === null) {
                    allErrors.push("Input data must be a non-null object.");
                    return { isValid: false, errors: allErrors };
                }
                
                const schemaKeys = Object.keys(this.targetSchema);
                const dataKeys = Object.keys(data);

                for (const key of schemaKeys) {
                    if (!(key in data)) {
                        allErrors.push(`Missing required field: ${key}`);
                        isValid = false;
                    }
                }

                // 2. Custom Validators (Sequential application)
                for (const validator of this.validators) {
                    const result = validator(data);
                    if (!result.isValid) {
                        allErrors.push(...result.errors);
                        isValid = false;
                    }
                }

                // 3. Constraints (Cross-field checks)
                for (const constraint of this.constraints) {
                    const result = constraint(data);
                    if (!result.isValid) {
                        allErrors.push(...result.errors);
                        isValid = false;
                    }
                }

                return { isValid: isValid, errors: allErrors };
            }
        };

        return pipeline;
    }
}