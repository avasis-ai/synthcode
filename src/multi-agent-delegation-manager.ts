import { EventEmitter } from "events"

type DelegationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"

export interface AgentRequest {
  taskDescription: string
  context: Record<string, unknown>
  agentSpecificParameters: Record<string, unknown>
}

export interface AgentResult {
  agentId: string
  status: "SUCCESS" | "FAILURE"
  output: string | Record<string, unknown>
  rawResult: any
}

export class MultiAgentDelegationManager extends EventEmitter {
  private currentStatus: DelegationStatus = "PENDING"
  private activeTasks: Map<string, Promise<AgentResult>> = new Map()
  private lastAggregatedContext: Record<string, unknown> = {}

  constructor() {
    super()
  }

  private updateStatus(newStatus: DelegationStatus): void {
    this.currentStatus = newStatus
    this.emit("statusChange", newStatus)
  }

  public getStatus(): DelegationStatus {
    return this.currentStatus
  }

  public getAggregatedContext(): Record<string, unknown> {
    return this.lastAggregatedContext
  }

  /**
   * Simulates delegating a task to a single specialized agent.
   * In a real implementation, this would involve API calls or message queuing.
   * @param agentId The ID of the agent to delegate to.
   * @param request The structured request payload.
   * @returns A promise that resolves with the agent's result.
   */
  private async executeAgentTask(agentId: string, request: AgentRequest): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error(`Agent ${agentId} failed due to internal error.`))
        } else {
          const result: AgentResult = {
            agentId: agentId,
            status: "SUCCESS",
            output: `Processed task '${request.taskDescription}' successfully using agent ${agentId}.`,
            rawResult: { success: true, data: `Output from ${agentId}` }
          }
          resolve(result)
        }
      }, 500 + Math.random() * 500)
    })
  }

  /**
   * Orchestrates the delegation of a complex task to multiple agents concurrently.
   * @param agents The list of agents responsible for the task.
   * @param request The structured request containing the task description and context.
   * @returns A promise that resolves with the final aggregated context.
   */
  public async delegateTask(
    agents: string[],
    request: AgentRequest
  ): Promise<Record<string, unknown>> {
    if (this.getStatus() !== "PENDING") {
      throw new Error("Cannot delegate task: Manager is not in PENDING state.")
    }

    this.updateStatus("IN_PROGRESS")
    this.activeTasks.clear()
    this.lastAggregatedContext = {}

    const taskPromises: Promise<AgentResult>[] = agents.map(agentId => {
      const taskPromise = this.executeAgentTask(agentId, request)
      this.activeTasks.set(agentId, taskPromise)
      return taskPromise
    })

    try {
      const results = await Promise.allSettled(taskPromises)

      const successfulResults: AgentResult[] = []
      const failedResults: { agentId: string, reason: any }[] = []

      results.forEach((result, index) => {
        const agentId = agents[index]
        if (result.status === "fulfilled") {
          successfulResults.push(result.value)
        } else {
          failedResults.push({ agentId: agentId, reason: result.reason })
        }
      })

      const finalContext = this.aggregateResults(successfulResults, failedResults)
      this.lastAggregatedContext = finalContext
      this.updateStatus("COMPLETED")
      return finalContext

    } catch (error) {
      this.updateStatus("FAILED")
      throw new Error(`Delegation failed: ${(error as Error).message}`)
    }
  }

  private aggregateResults(
    successfulResults: AgentResult[],
    failedResults: { agentId: string, reason: any }[]
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {
      overallStatus: failedResults.length > 0 ? "PARTIAL_FAILURE" : "SUCCESS",
      successfulAgents: successfulResults.length,
      failedAgents: failedResults.length,
      aggregatedOutput: {}
    }

    successfulResults.forEach(result => {
      context.aggregatedOutput[`${result.agentId}_output`] = result.output
    })

    if (failedResults.length > 0) {
      context.errorDetails = failedResults.map(f => ({
        agentId: f.agentId,
        error: f.reason.message || String(f.reason)
      }))
    }

    return context
  }
}
export { MultiAgentDelegationManager }