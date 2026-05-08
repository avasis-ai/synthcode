import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ExternalAction {
  idempotencyKey: string;
  execute: (context: Record<string, unknown>) => Promise<any>;
  compensate: (context: Record<string, unknown>) => Promise<void>;
}

export class ExternalActionCoordinator {
  constructor() {}

  /**
   * Executes a sequence of external actions atomically. If any action fails,
   * compensation logic is run for all successfully completed actions in reverse order.
   *
   * @param actions The array of actions to execute.
   * @param context The shared context object passed to all actions.
   * @returns A promise that resolves with the result of the last successful action.
   * @throws An error if any action fails, after attempting compensation.
   */
  public async executeTransaction(
    actions: ExternalAction[],
    context: Record<string, unknown>
  ): Promise<any> {
    const successfulActions: ExternalAction[] = [];

    try {
      for (const action of actions) {
        await action.execute(context);
        successfulActions.push(action);
      }
      return successfulActions[successfulActions.length - 1];
    } catch (error) {
      console.error("Transaction failed. Initiating compensation/rollback sequence.");
      
      // Rollback successful actions in reverse order
      for (let i = successfulActions.length - 1; i >= 0; i--) {
        const action = successfulActions[i];
        try {
          await action.compensate(context);
        } catch (compensationError) {
          console.error(
            `CRITICAL: Failed to compensate action ${action.idempotencyKey}. Manual intervention required.`,
            compensationError
          );
          // We continue rolling back even if compensation fails, logging the error.
        }
      }
      
      // Re-throw the original error after compensation attempts
      throw error;
    }
  }
}