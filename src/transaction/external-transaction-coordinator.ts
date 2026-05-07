import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message,
} from "./types";

type TransactionContext = Record<string, unknown>;

type TransactionStepFunction = (context: TransactionContext) => Promise<any>;
type CompensationFunction = (context: TransactionContext) => Promise<void>;

export interface TransactionStep {
    name: string;
    execute: TransactionStepFunction;
    compensate: CompensationFunction;
}

export class ExternalTransactionCoordinator {
    private steps: TransactionStep[] = [];

    constructor() {}

    addStep(step: TransactionStep): void {
        this.steps.push(step);
    }

    /**
     * Executes a sequence of transaction steps (Saga). If any step fails,
     * it automatically executes compensation actions for all previously successful steps
     * in reverse order.
     * @param initialContext The initial state context for the transaction.
     * @returns A promise that resolves when the transaction completes successfully.
     */
    public async executeTransaction(initialContext: TransactionContext): Promise<TransactionContext> {
        let context: TransactionContext = { ...initialContext };
        const successfulSteps: TransactionStep[] = [];

        for (const step of this.steps) {
            try {
                console.log(`[Coordinator] Starting step: ${step.name}`);
                
                // Execute the step
                const result = await step.execute(context);
                
                // Update context with results (assuming the result can update the context)
                context = { ...context, [step.name]: result };
                
                successfulSteps.push(step);
                console.log(`[Coordinator] Successfully completed step: ${step.name}`);

            } catch (error) {
                console.error(`[Coordinator] Step failed: ${step.name}. Initiating rollback.`);
                
                // Rollback mechanism: Compensate successful steps in reverse order
                await this.compensateTransaction(successfulSteps, context);

                // Re-throw the original error after compensation
                throw new Error(`Transaction failed at step ${step.name}. Compensation executed. Original error: ${(error as Error).message}`);
            }
        }

        return context;
    }

    private async compensateTransaction(successfulSteps: TransactionStep[], context: TransactionContext): Promise<void> {
        // Iterate backward through successful steps
        for (let i = successfulSteps.length - 1; i >= 0; i--) {
            const step = successfulSteps[i];
            try {
                console.log(`[Coordinator] Compensating step: ${step.name}`);
                await step.compensate(context);
                console.log(`[Coordinator] Compensation successful for step: ${step.name}`);
            } catch (compensationError) {
                // Critical logging: If compensation fails, manual intervention is required.
                console.error(`[CRITICAL] Failed to compensate step: ${step.name}. Manual intervention required!`, compensationError);
                // We continue compensating other steps even if one fails, to maximize rollback effort.
            }
        }
    }
}