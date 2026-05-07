import { EventEmitter } from "node:events"

export interface TransactionStep {
  execute: () => Promise<any>;
  rollback: () => Promise<void>;
}

export class TransactionalWorkflowCoordinator {
  private readonly steps: TransactionStep[]

  constructor(steps: TransactionStep[]) {
    this.steps = steps
  }

  /**
   * Executes the workflow steps sequentially. If any step fails,
   * it automatically executes compensating actions (rollback)
   * for all previously successful steps.
   * @returns A promise that resolves when all steps complete successfully.
   * @throws An error if any step fails, after attempting rollbacks.
   */
  public async executeWorkflow(): Promise<void> {
    const successfulSteps: TransactionStep[] = []

    try {
      for (const step of this.steps) {
        await step.execute()
        successfulSteps.push(step)
      }
    } catch (error) {
      console.error("Workflow failed. Initiating rollback sequence.", error)
      await this.rollback(successfulSteps)
      throw error
    }
  }

  /**
   * Executes the rollback procedure for all steps that successfully completed
   * before the failure point. Rollbacks are executed in reverse order.
   * @param successfulSteps The list of steps that need compensating actions.
   */
  private async rollback(successfulSteps: TransactionStep[]): Promise<void> {
    for (let i = successfulSteps.length - 1; i >= 0; i--) {
      const step = successfulSteps[i]
      try {
        await step.rollback()
      } catch (rollbackError) {
        console.error(`CRITICAL: Failed to execute rollback for step ${i}. Manual intervention required.`, rollbackError)
      }
    }
  }
}