import { Message } from "./message";

export interface Guard {
  preCheck: (context: Record<string, unknown>, toolInput: Record<string, unknown>) => { isValid: boolean; reason?: string };
  postProcess: (result: any, context: Record<string, unknown>): any;
}

export interface ToolExecutionGuard {
  execute: (
    toolFn: (input: Record<string, unknown>) => Promise<any>,
    context: Record<string, unknown>,
    toolInput: Record<string, unknown>
  ) => Promise<any>;
}

export class ToolExecutionGuardImpl implements ToolExecutionGuard {
  private guards: Guard[];
  private failureCount: number = 0;
  private readonly circuitBreakerThreshold: number;
  private readonly circuitBreakerTimeoutMs: number;

  constructor(guards: Guard[], circuitBreakerThreshold: number = 3, circuitBreakerTimeoutMs: number = 5000) {
    this.guards = guards;
    this.circuitBreakerThreshold = circuitBreakerThreshold;
    this.circuitBreakerTimeoutMs = circuitBreakerTimeoutMs;
  }

  private checkCircuitBreaker(context: Record<string, unknown>): { canExecute: boolean; reason?: string } {
    if (this.failureCount >= this.circuitBreakerThreshold) {
      const lastFailureTime = context["lastToolFailureTime"] as number | undefined;
      if (lastFailureTime && Date.now() < lastFailureTime + this.circuitBreakerTimeoutMs) {
        return { canExecute: false, reason: "Circuit Breaker Open: Too many recent failures." };
      } else {
        // Time elapsed, reset failure count and allow execution
        this.failureCount = 0;
        return { canExecute: true };
      }
    }
    return { canExecute: true };
  }

  private handleFailure(context: Record<string, unknown>): void {
    this.failureCount++;
    context["lastToolFailureTime"] = Date.now();
  }

  async execute(
    toolFn: (input: Record<string, unknown>) => Promise<any>,
    context: Record<string, unknown>,
    toolInput: Record<string, unknown>
  ): Promise<any> {
    const preCheckResult = this.guards.reduce(
      (acc, guard) => {
        const check = guard.preCheck(context, toolInput);
        if (!check.isValid) {
          return { isValid: false, reason: check.reason };
        }
        return acc;
      },
      { isValid: true }
    );

    if (!preCheckResult.isValid) {
      throw new Error(`Pre-execution validation failed: ${preCheckResult.reason}`);
    }

    const circuitCheck = this.checkCircuitBreaker(context);
    if (!circuitCheck.canExecute) {
      throw new Error(`Tool execution blocked by guardrail: ${circuitCheck.reason}`);
    }

    try {
      const rawResult = await toolFn(toolInput);

      let finalResult: any = rawResult;
      for (const guard of this.guards) {
        finalResult = guard.postProcess(finalResult, context);
      }

      this.failureCount = 0; // Success resets the counter
      return finalResult;
    } catch (error) {
      this.handleFailure(context);
      throw new Error(`Tool execution failed after guards: ${(error as Error).message}`);
    }
  }
}

export const createToolExecutionGuard = (
  guards: Guard[],
  circuitBreakerThreshold: number = 3,
  circuitBreakerTimeoutMs: number = 5000
): ToolExecutionGuard => {
  return new ToolExecutionGuardImpl(guards, circuitBreakerThreshold, circuitBreakerTimeoutMs);
};