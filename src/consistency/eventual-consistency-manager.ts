import { EventEmitter } from "node:events";

export type CompensationAction = (context: Map<string, any>) => Promise<void> | void;

export interface WorkflowStep {
  stepName: string;
  action: (context: Map<string, any>) => Promise<any> | any;
  expectedEventId: string;
  compensation: CompensationAction;
}

export interface ConsistencyWorkflow {
  steps: WorkflowStep[];
}

export class EventualConsistencyManager {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Processes a workflow that relies on eventual consistency.
   * It waits for confirmation events and manages state transitions.
   * @param workflow The defined workflow steps.
   * @param context Initial context data for the workflow.
   * @param timeoutMs Maximum time to wait for all confirmations.
   */
  public async processWorkflow(
    workflow: ConsistencyWorkflow,
    context: Map<string, any>,
    timeoutMs: number
  ): Promise<Map<string, any>> {
    let currentContext = new Map(context);
    
    for (const step of workflow.steps) {
      try {
        await step.action(currentContext);
        
        console.log(`[ConsistencyManager] Executing step: ${step.stepName}. Waiting for event: ${step.expectedEventId}`);

        const confirmation = await this.waitForConfirmation(
          step.expectedEventId,
          timeoutMs,
          step.stepName
        );

        if (!confirmation) {
          throw new Error(`Timeout or failure to confirm state for step: ${step.stepName}`);
        }
        
        currentContext.set(`${step.stepName}_status`, "COMPLETED");

      } catch (error) {
        console.error(`[ConsistencyManager] Workflow failed at step ${step.stepName}. Initiating compensation.`);
        await this.compensate(step, currentContext);
        throw new Error(`Workflow failed and compensated at ${step.stepName}: ${(error as Error).message}`);
      }
    }

    return currentContext;
  }

  /**
   * Waits for a specific confirmation event to be emitted.
   * @param expectedEventId The ID of the event to wait for.
   * @param timeoutMs The maximum time to wait.
   * @param stepName The name of the step currently waiting.
   * @returns A boolean indicating successful confirmation.
   */
  private waitForConfirmation(
    expectedEventId: string,
    timeoutMs: number,
    stepName: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let timeoutHandle: NodeJS.Timeout;
      let confirmationReceived = false;

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        this.eventEmitter.removeListener(`confirmation:${expectedEventId}`, listener);
      };

      const listener = (event: { event: string; data: any }) => {
        if (event.event === `confirmation:${expectedEventId}`) {
          confirmationReceived = true;
          cleanup();
          resolve(true);
        }
      };

      this.eventEmitter.once(`confirmation:${expectedEventId}`, listener);

      timeoutHandle = setTimeout(() => {
        if (!confirmationReceived) {
          cleanup();
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  /**
   * Executes the compensation action for a failed step.
   * @param failedStep The step that failed.
   * @param context The current workflow context.
   */
  private async compensate(failedStep: WorkflowStep, context: Map<string, any>): Promise<void> {
    try {
      await failedStep.compensation(context);
      console.log(`[ConsistencyManager] Compensation successful for step: ${failedStep.stepName}.`);
    } catch (compensationError) {
      console.error(`[ConsistencyManager] CRITICAL: Compensation failed for step ${failedStep.stepName}. Manual intervention required.`, compensationError);
      // In a real system, this would trigger alerts/dead-letter queues
    }
  }
}