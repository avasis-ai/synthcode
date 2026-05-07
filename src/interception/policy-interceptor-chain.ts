import { Context, Action } from "../types";

export interface PolicyInterceptor {
  intercept(context: Context, action: Action): Promise<Context>;
}

export class PolicyInterceptorChain {
  private interceptors: PolicyInterceptor[];

  constructor(interceptors: PolicyInterceptor[] = []) {
    this.interceptors = interceptors;
  }

  /**
   * Executes all registered interceptors sequentially.
   * Each interceptor receives the context and action, and must return a modified context.
   * The output of one interceptor becomes the input context for the next.
   *
   * @param initialContext The starting context.
   * @param action The action being proposed.
   * @returns A promise resolving to the final, modified context.
   * @throws Will throw if any interceptor fails or explicitly throws a policy violation.
   */
  public async execute(initialContext: Context, action: Action): Promise<Context> {
    let currentContext: Context = initialContext;

    for (const interceptor of this.interceptors) {
      try {
        currentContext = await interceptor.intercept(currentContext, action);
      } catch (error) {
        // Re-throw the error to signal policy violation or failure
        throw new Error(`Policy violation or interception failure: ${(error as Error).message}`);
      }
    }

    return currentContext;
  }
}