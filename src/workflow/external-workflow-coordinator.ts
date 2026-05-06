import { EventEmitter } from "node:events"

type WorkflowContext = Record<string, unknown>

interface WorkflowResult {
  success: boolean
  context: WorkflowContext
  output: Record<string, unknown>
}

interface WorkflowStep {
  name: string
  execute: (context: WorkflowContext) => Promise<WorkflowResult>
  retryable?: boolean
}

export class ExternalWorkflowCoordinator extends EventEmitter {
  private steps: WorkflowStep[]

  constructor(steps: WorkflowStep[]) {
    super()
    this.steps = steps
  }

  async execute(initialContext: WorkflowContext): Promise<WorkflowResult> {
    let currentContext: WorkflowContext = {
      ...initialContext,
      workflow_state: "INITIALIZED",
    }
    let lastResult: WorkflowResult | null = null

    for (const step of this.steps) {
      this.emit("before_step", { stepName: step.name, context: currentContext })

      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          const result = await step.execute(currentContext)

          if (!result.success) {
            throw new Error(`Step ${step.name} failed: ${JSON.stringify(result.output)}`)
          }

          currentContext = {
            ...currentContext,
            ...result.context,
          }
          lastResult = result
          break
        } catch (error) {
          attempts += 1
          const isRetryable = step.retryable && attempts < maxAttempts
          const errorMessage = error instanceof Error ? error.message : "Unknown error"

          if (isRetryable) {
            this.emit("retry_attempt", { stepName: step.name, attempt: attempts, error: errorMessage })
            // Simulate backoff delay
            await new Promise((resolve) => setTimeout(resolve, 100 * attempts))
          } else {
            this.emit("workflow_failed", { stepName: step.name, error: errorMessage, context: currentContext })
            return {
              success: false,
              context: currentContext,
              output: { error: `Workflow failed at step ${step.name}: ${errorMessage}` },
            }
          }
        }
      }

      if (attempts === maxAttempts) {
        this.emit("workflow_failed", { stepName: step.name, error: "Exceeded maximum retries", context: currentContext })
        return {
          success: false,
          context: currentContext,
          output: { error: `Workflow failed permanently at step ${step.name}` },
        }
      }
    }

    this.emit("workflow_completed", { finalContext: currentContext, finalResult: lastResult })

    return {
      success: true,
      context: currentContext,
      output: lastResult ? lastResult.output : {},
    }
  }
}