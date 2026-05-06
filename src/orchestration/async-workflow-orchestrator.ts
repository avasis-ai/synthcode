import { setTimeout } from "timers/promises"

type WorkflowStatus = "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED"

interface WorkflowStep {
    name: string
    execute?: (context: Record<string, unknown>) => Promise<any> | any
    asyncExecute?: (context: Record<string, unknown>) => Promise<{ success: boolean; data: unknown; pollIntervalMs: number }>
}

export class WorkflowOrchestrator {
    private steps: WorkflowStep[]
    private status: WorkflowStatus = "PENDING"
    private context: Record<string, unknown> = {}

    constructor(steps: WorkflowStep[]) {
        this.steps = steps
    }

    public getStatus(): WorkflowStatus {
        return this.status
    }

    public getContext(): Record<string, unknown> {
        return this.context
    }

    private updateStatus(newStatus: WorkflowStatus): void {
        this.status = newStatus
    }

    public async runWorkflow(): Promise<void> {
        this.updateStatus("RUNNING")
        let stepIndex = 0

        for (const step of this.steps) {
            try {
                if (!step.name) {
                    throw new Error("Workflow step must have a name.")
                }

                if (step.execute) {
                    await this.executeSyncStep(step)
                } else if (step.asyncExecute) {
                    await this.executeAsyncStep(step)
                } else {
                    throw new Error(`Step ${step.name} must define either execute or asyncExecute method.`)
                }

                stepIndex++
            } catch (error) {
                this.updateStatus("FAILED")
                throw new Error(`Workflow failed at step ${step.name}: ${(error as Error).message}`)
            }
        }

        this.updateStatus("COMPLETED")
    }

    private async executeSyncStep(step: WorkflowStep): Promise<void> {
        const result = step.execute(this.context)
        if (result instanceof Promise) {
            await result
        } else {
            // Assuming sync steps update context or just run side effects
        }
    }

    private async executeAsyncStep(step: WorkflowStep): Promise<void> {
        const MAX_POLLING_ATTEMPTS = 10
        const POLLING_TIMEOUT_MS = 60000

        for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
            const pollResult = await step.asyncExecute(this.context)

            if (!pollResult) {
                throw new Error("Async step failed to provide poll result.")
            }

            if (pollResult.success) {
                this.context[step.name] = pollResult.data
                return
            }

            if (attempt >= MAX_POLLING_ATTEMPTS) {
                throw new Error(`Async step ${step.name} timed out after ${POLLING_TIMEOUT_MS / 1000} seconds.`)
            }

            await setTimeout(pollResult.pollIntervalMs)
        }
    }
}