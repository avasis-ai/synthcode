import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type RollbackAction = () => Promise<void>;

interface TrackedOperation {
  description: string;
  // The action to perform during commit
  commitAction: () => Promise<any>;
  // The action to perform during rollback
  rollbackAction: RollbackAction;
}

export class UnitOfWorkManager {
  private operations: TrackedOperation[] = [];
  private isTransactionActive: boolean = false;

  beginTransaction(): Promise<void> {
    if (this.isTransactionActive) {
      return Promise.reject(new Error("Transaction already active."));
    }
    this.operations = [];
    this.isTransactionActive = true;
    return Promise.resolve();
  }

  /**
   * Registers an operation that must be committed or rolled back.
   * @param description A human-readable description of the operation.
   * @param commitAction The asynchronous function to execute the change.
   * @param rollbackAction The asynchronous function to revert the change.
   */
  registerOperation(
    description: string,
    commitAction: () => Promise<any>,
    rollbackAction: RollbackAction
  ): void {
    if (!this.isTransactionActive) {
      throw new Error("Cannot register operation: No active transaction.");
    }
    this.operations.push({
      description,
      commitAction,
      rollbackAction,
    });
  }

  /**
   * Executes all registered commit actions sequentially.
   * If successful, the transaction is marked as committed.
   */
  async commit(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new Error("Cannot commit: No active transaction.");
    }

    try {
      for (const op of this.operations) {
        await op.commitAction();
      }
      this.isTransactionActive = false;
      this.operations = [];
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Executes all registered rollback actions in reverse order.
   * This ensures that changes are undone in the reverse order they were applied.
   */
  async rollback(): Promise<void> {
    if (!this.isTransactionActive && this.operations.length === 0) {
      return;
    }

    for (let i = this.operations.length - 1; i >= 0; i--) {
      const op = this.operations[i];
      try {
        await op.rollbackAction();
      } catch (rollbackError) {
        console.error(
          `[UoW] Warning: Failed to rollback operation '${op.description}'. Manual intervention may be required.`,
          rollbackError
        );
      }
    }
    this.isTransactionActive = false;
    this.operations = [];
  }

  /**
   * Utility function to wrap a complex transactional block.
   * @param block The asynchronous function containing the transactional logic.
   */
  async executeTransaction<T>(block: (manager: UnitOfWorkManager) => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await block(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}