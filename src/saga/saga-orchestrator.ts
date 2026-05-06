export interface SagaStep {
    execute: async () => Promise<any>;
    compensate: async (context: any): Promise<void>;
}

export class SagaOrchestrator {
    constructor() {}

    async executeSaga(steps: SagaStep[], initialContext: any = {}): Promise<any> {
        const successfulCompensations: ((context: any) => Promise<void>)[] = [];
        let currentContext = { ...initialContext };

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            try {
                // Execute the primary action
                const result = await step.execute();
                
                // Update context with results if necessary (assuming result contains context updates)
                currentContext = { ...currentContext, ...result };

                // Record the compensation function for this step
                successfulCompensations.push(async (context: any) => {
                    await step.compensate(context);
                });
            } catch (error) {
                console.error("Saga failed at step", i, ":", error);

                // Rollback: Execute compensation functions in reverse order
                for (let j = successfulCompensations.length - 1; j >= 0; j--) {
                    const compensation = successfulCompensations[j];
                    try {
                        await compensation(currentContext);
                    } catch (compensationError) {
                        console.error("CRITICAL: Compensation failed for step", j, ":", compensationError);
                        // We continue rolling back even if compensation fails
                    }
                }
                
                // Re-throw the original error to signal failure
                throw error;
            }
        }

        return currentContext;
    }
}

export { SagaOrchestrator }