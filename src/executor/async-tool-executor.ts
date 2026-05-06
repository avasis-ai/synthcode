import { EventEmitter } from "node:events"

type JobStatus = "PENDING" | "SUCCESS" | "FAILURE" | "TIMEOUT"

interface StatusResult {
  status: JobStatus
  result?: string
  error?: string
}

interface AsyncToolDefinition {
  name: string
  submitJob: (input: Record<string, unknown>) => Promise<string>
  checkStatus: (jobId: string) => Promise<StatusResult>
}

interface PollingStrategy {
  maxAttempts: number
  initialDelayMs: number
  backoffFactor: number
}

class AsyncToolExecutor extends EventEmitter {
  private tool: AsyncToolDefinition
  private strategy: PollingStrategy

  constructor(tool: AsyncToolDefinition, strategy: PollingStrategy) {
    super()
    this.tool = tool
    this.strategy = strategy
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  public async execute(input: Record<string, unknown>): Promise<{ success: boolean; result: string }> {
    let jobId: string
    try {
      jobId = await this.tool.submitJob(input)
    } catch (e) {
      return { success: false, result: `Failed to submit job: ${(e as Error).message}` }
    }

    let currentDelay = this.strategy.initialDelayMs
    let attempts = 0

    while (attempts < this.strategy.maxAttempts) {
      try {
        const statusResult = await this.tool.checkStatus(jobId)

        if (statusResult.status === "SUCCESS") {
          return { success: true, result: statusResult.result || "Job completed successfully." }
        }

        if (statusResult.status === "FAILURE") {
          return { success: false, result: `Job failed: ${statusResult.error || "Unknown failure."}` }
        }

        if (statusResult.status === "PENDING") {
          if (attempts > 0) {
            await this.sleep(currentDelay)
            currentDelay = Math.min(currentDelay * this.strategy.backoffFactor, 60000)
          } else {
            await this.sleep(currentDelay)
          }
        }
      } catch (e) {
        const error = e as Error
        if (attempts === this.strategy.maxAttempts - 1) {
          return { success: false, result: `Polling failed after multiple retries: ${error.message}` }
        }
      }
      attempts++
    }

    return { success: false, result: `Job timed out or exceeded maximum attempts (${this.strategy.maxAttempts}).` }
  }
}

export { AsyncToolExecutor }