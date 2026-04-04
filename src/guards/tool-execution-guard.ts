import { Message } from "./types";

export interface Guard<T, R> {
  preExecute(context: T): Promise<T>;
  postExecute(result: R): Promise<R>;
}

export class ToolExecutionGuardChain<T, R> {
  private guards: Guard<T, R>[];

  constructor(guards: Guard<T, R>[] = []) {
    this.guards = guards;
  }

  public async execute(context: T, toolResult: R): Promise<R> {
    let currentContext: T = context;

    for (const guard of this.guards) {
      try {
        currentContext = await guard.preExecute(currentContext);
      } catch (error) {
        throw new Error(`Pre-execution guard failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    let finalResult: R = toolResult;

    for (const guard of this.guards) {
      try {
        finalResult = await guard.postExecute(finalResult);
      } catch (error) {
        throw new Error(`Post-execution guard failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return finalResult;
  }
}

export const createToolExecutionGuardChain = <T, R>(
  guards: Guard<T, R>[]
): ToolExecutionGuardChain<T, R> => {
  return new ToolExecutionGuardChain<T, R>(guards);
};