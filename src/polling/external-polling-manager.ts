import { setTimeout } from "timers/promises"

export interface PollingStep {
  endpoint: string
  intervalMs: number
  maxAttempts: number
  successCondition: (data: any) => boolean
  fetcher: (attempt: number) => Promise<any>
}

export class PollingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PollingError"
  }
}

export class ExternalPollingManager {
  private pollingStep: PollingStep

  constructor(pollingStep: PollingStep) {
    this.pollingStep = pollingStep
  }

  public async execute(): Promise<any> {
    let attempt = 0
    let lastError: Error | null = null

    while (attempt < this.pollingStep.maxAttempts) {
      attempt++
      try {
        const data = await this.pollingStep.fetcher(attempt)

        if (this.pollingStep.successCondition(data)) {
          return data
        }

        console.log(`Polling attempt ${attempt} successful but condition not met. Retrying in ${this.pollingStep.intervalMs}ms...`)
      } catch (error) {
        lastError = error as Error
        console.error(`Polling attempt ${attempt} failed: ${error.message}`)
      }

      if (attempt < this.pollingStep.maxAttempts) {
        await setTimeout(this.pollingStep.intervalMs)
      }
    }

    const errorMessage = `Polling failed after ${this.pollingStep.maxAttempts} attempts. Last error: ${lastError ? lastError.message : "Unknown error"}`
    throw new PollingError(errorMessage)
  }
}