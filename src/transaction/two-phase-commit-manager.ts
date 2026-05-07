import { EventEmitter } from "node:events";

export enum TransactionState {
  PENDING = "PENDING",
  PREPARED = "PREPARED",
  COMMITTED = "COMMITTED",
  ROLLED_BACK = "ROLLED_BACK",
  FAILED = "FAILED",
}

export interface CompensationAction {
  execute: (transactionId: string) => Promise<void>;
}

export interface TransactionContext {
  transactionId: string;
  state: TransactionState;
  compensationActions: CompensationAction[];
  // Placeholder for any data needed during the transaction
  data: Record<string, unknown>;
}

export interface TransactionAction {
  name: string;
  prepare: (context: TransactionContext) => Promise<{ success: boolean; message: string }>;
  commit: (context: TransactionContext) => Promise<{ success: boolean; message: string }>;
  compensate: (context: TransactionContext) => Promise<{ success: boolean; message: string }>;
}

export class TwoPhaseCommitManager extends EventEmitter {
  private transactions: Map<string, TransactionContext> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  beginTransaction(action: TransactionAction): TransactionContext {
    const transactionId = this.generateId();
    const context: TransactionContext = {
      transactionId,
      state: TransactionState.PENDING,
      compensationActions: [],
      data: {},
    };
    this.transactions.set(transactionId, context);
    return context;
  }

  async executePhase1(action: TransactionAction, context: TransactionContext): Promise<boolean> {
    if (context.state !== TransactionState.PENDING) {
      throw new Error(`Cannot execute Phase 1. Current state is ${context.state}`);
    }

    try {
      const prepareResult = await action.prepare(context);
      if (!prepareResult.success) {
        context.state = TransactionState.FAILED;
        throw new Error(`Prepare failed: ${prepareResult.message}`);
      }

      // Record compensation action (rollback logic)
      const compensation: CompensationAction = {
        execute: async (id: string) => {
          console.log(`Executing compensation for ${id} via ${action.name}`);
          return action.compensate(context);
        },
      };
      context.compensationActions.push(compensation);

      context.state = TransactionState.PREPARED;
      return true;
    } catch (error) {
      console.error("Phase 1 execution failed:", error);
      context.state = TransactionState.FAILED;
      return false;
    }
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    const context = this.transactions.get(transactionId);
    if (!context || context.state !== TransactionState.PREPARED) {
      throw new Error(`Cannot commit transaction ${transactionId}. Must be in PREPARED state.`);
    }

    try {
      const action = this.getActionForTransaction(transactionId);
      if (!action) {
        throw new Error("Transaction action not found.");
      }

      const commitResult = await action.commit(context);
      if (!commitResult.success) {
        throw new Error(`Commit failed: ${commitResult.message}`);
      }

      context.state = TransactionState.COMMITTED;
      return true;
    } catch (error) {
      console.error(`Commit failed for ${transactionId}. Attempting rollback.`, error);
      await this.rollbackTransaction(transactionId);
      return false;
    }
  }

  async rollbackTransaction(transactionId: string): Promise<void> {
    const context = this.transactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    if (context.state === TransactionState.COMMITTED || context.state === TransactionState.ROLLED_BACK) {
      console.warn(`Transaction ${transactionId} is already ${context.state}. No rollback needed.`);
      return;
    }

    try {
      context.compensationActions.reverse().forEach(compensation => {
        await compensation.execute(transactionId);
      });
      context.state = TransactionState.ROLLED_BACK;
    } catch (error) {
      console.error(`CRITICAL: Failed to fully roll back transaction ${transactionId}. Manual intervention required.`, error);
      // State remains FAILED or ROLLED_BACK, but we log the failure.
    }
  }

  private getActionForTransaction(transactionId: string): TransactionAction | undefined {
    // In a real system, the action would be stored with the context.
    // For this simulation, we assume the action is passed or retrieved globally.
    // Since we cannot pass the action through the context easily, we'll assume the caller manages the action object.
    // This method is a placeholder for robust state retrieval.
    return undefined;
  }
}