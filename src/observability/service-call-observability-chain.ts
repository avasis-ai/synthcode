import { Context } from "./context";

export interface ObservabilityHook {
  name: string;
  preCall?: async (context: Context): Promise<void> | null;
  postCall?: async (context: Context, result: any): Promise<void> | null;
  onError?: async (context: Context, error: Error): Promise<void> | null;
}

export class ServiceCallObservabilityChain {
  private hooks: ObservabilityHook[] = [];

  constructor() {}

  addHook(hook: ObservabilityHook): this {
    this.hooks.push(hook);
    return this;
  }

  /**
   * Executes the target function wrapped by all registered observability hooks.
   * @param targetFn The asynchronous function representing the service call.
   * @param context The initial execution context.
   * @returns The result of the target function execution.
   * @throws The error thrown by the target function or any hook.
   */
  public async execute<T>(
    targetFn: async (...args: any[]) => Promise<T>,
    context: Context,
  ): Promise<T> {
    let finalContext = { ...context };

    try {
      // 1. Pre-call hooks execution
      for (const hook of this.hooks) {
        if (hook.preCall) {
          await hook.preCall(finalContext);
        }
      }

      // 2. Target function execution
      const result: T = await targetFn(finalContext);

      // 3. Post-call hooks execution
      for (const hook of this.hooks) {
        if (hook.postCall) {
          await hook.postCall(finalContext, result);
        }
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // 4. Error hooks execution
      for (const hook of this.hooks) {
        if (hook.onError) {
          await hook.onError(finalContext, err);
        }
      }
      throw err;
    }
  }
}