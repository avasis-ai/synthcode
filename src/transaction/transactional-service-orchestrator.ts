import { EventEmitter } from "node:events"

type StepResult = unknown

interface TransactionStep {
  name: string
  execute: () => Promise<StepResult>
  compensate: (result: StepResult) => Promise<void>
}

export class TransactionalServiceOrchestrator {
  private steps: TransactionStep[]

  constructor(steps: TransactionStep[]) {
    if (!steps || steps.length === 0) {
      throw new Error("Orchestrator must be initialized with at least one transaction step.")
    }
    this.steps = steps
  }

  /**
   * Executes the sequence of steps. If any step fails, it automatically executes
   * compensating actions (rollbacks) for all previously successful steps in reverse order.
   * @returns A promise that resolves with the result of the last successful step.
   */
  public async execute(): Promise<StepResult> {
    const successfulSteps: { step: TransactionStep; result: StepResult }[] = []

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i]
      try {
        const result = await step.execute()
        successfulSteps.push({ step, result })
      } catch (error) {
        console.error(`Transaction failed at step: ${step.name}. Initiating rollback...`)
        await this.rollback(successfulSteps)
        throw new Error(`Transaction failed at ${step.name}: ${(error as Error).message}`)
      }
    }

    // Return the result of the last successful step
    return successfulSteps[successfulSteps.length - 1].result
  }

  private async rollback(successfulSteps: { step: TransactionStep; result: StepResult }[]): Promise<void> {
    // Iterate backwards through successfully completed steps
    for (let i = successfulSteps.length - 1; i >= 0; i--) {
      const { step, result } = successfulSteps[i]
      try {
        console.log(`Executing compensation for step: ${step.name}`)
        await step.compensate(result)
      } catch (compensationError) {
        // Log compensation failure but do not re-throw, as we must attempt to roll back all steps.
        console.error(`CRITICAL: Failed to compensate step ${step.name}. Manual intervention required. Error:`, compensationError)
      }
    }
  }
}