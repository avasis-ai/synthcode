import { EventEmitter } from "node:events"

type ServiceCallFunction = (input: Record<string, unknown>) => Promise<any>;

export interface FallbackCondition {
  (result: any, error: Error | null): boolean;
}

export interface RetryStrategy {
  (attempt: number, lastError: Error | null): Promise<any>;
}

export interface FallbackStep {
  serviceCall: ServiceCallFunction;
  condition?: FallbackCondition;
  retryStrategy?: RetryStrategy;
}

export class ServiceFallbackChainExecutor {
  private readonly steps: FallbackStep[]

  constructor(steps: FallbackStep[]) {
    this.steps = steps
  }

  private async executeStep(step: FallbackStep, input: Record<string, unknown>): Promise<any> {
    let lastError: Error | null = null
    let result: any = null
    let attempt = 0

    while (true) {
      try {
        result = await step.serviceCall(input)
        return result
      } catch (error) {
        lastError = error as Error
        attempt++

        if (step.retryStrategy) {
          try {
            result = await step.retryStrategy(attempt, lastError)
            return result
          } catch (retryError) {
            lastError = retryError as Error
            // If retry fails, break and let the main loop handle fallback
            break
          }
        } else {
          // No retry strategy defined, break immediately
          break
        }
      }
    }
    throw lastError || new Error("Execution failed without specific error")
  }

  public async executeChain(initialInput: Record<string, unknown>): Promise<any> {
    let lastSuccessfulResult: any = null

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i]
      let stepResult: any = null
      let stepFailed = false

      try {
        stepResult = await this.executeStep(step, initialInput)
        lastSuccessfulResult = stepResult
      } catch (error) {
        const error = error as Error
        stepFailed = true

        if (step.condition && !step.condition(null, error)) {
          console.warn(`Step ${i} failed, but condition (${step.condition}) suggests proceeding to next step.`)
          continue
        }

        if (i < this.steps.length - 1) {
          console.warn(`Step ${i} failed. Attempting fallback to Step ${i + 1}.`)
          // Continue to the next step (fallback)
        } else {
          console.error(`All steps failed. Final failure at Step ${i}.`)
          throw error
        }
      }

      if (stepFailed && i === this.steps.length - 1) {
        throw new Error(`Chain execution failed at the final step: ${this.steps[i].serviceCall.name}`)
      }
    }

    return lastSuccessfulResult
  }
}

export { ServiceFallbackChainExecutor }