import { Message, ToolResultMessage } from "./message-types";

export type PipelineResult<T> = {
    output: T;
    errors: string[];
};

export type PipelineStep<I, O> = (input: I) => Promise<PipelineResult<O>>;

export class ToolOutputPipeline<I, O> {
    private readonly steps: { step: PipelineStep<any, any>; name: string }[];

    constructor(steps: { step: PipelineStep<any, any>; name: string }[]) {
        this.steps = steps;
    }

    public async run(initialInput: I): Promise<PipelineResult<O>> {
        let currentOutput: any = initialInput;
        let accumulatedErrors: string[] = [];

        for (const { step, name } of this.steps) {
            try {
                const result = await step(currentOutput);

                if (result.errors.length > 0) {
                    accumulatedErrors.push(`Step "${name}" failed validation: ${result.errors.join('; ')}`);
                    // Decide whether to halt or continue with partial data.
                    // For robustness, we'll halt on critical failure, but for this example,
                    // we'll pass the last known good output if possible, or just the input.
                    // Here, we'll treat the error as a failure to proceed meaningfully.
                    return { output: null as unknown as O, errors: [...accumulatedErrors, `Pipeline halted at step "${name}" due to errors.`] };
                }

                currentOutput = result.output;
            } catch (error) {
                accumulatedErrors.push(`Step "${name}" threw an unexpected error: ${(error as Error).message}`);
                return { output: null as unknown as O, errors: [...accumulatedErrors, `Pipeline halted at step "${name}" due to runtime error.`] };
            }
        }

        return { output: currentOutput as O, errors: accumulatedErrors };
    }
}