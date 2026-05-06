import { setTimeout } from "timers/promises"

export interface ServiceDescriptor {
    name: string
    endpoint: string
    auth: (data: Record<string, unknown>) => Record<string, unknown>
    retryPolicy: {
        maxAttempts: number
        initialDelayMs: number
        multiplier: number
    }
    circuitBreaker: {
        failureThreshold: number
        resetTimeoutMs: number
    }
}

export interface WorkflowStep {
    descriptor: ServiceDescriptor
    inputMapper: (state: Record<string, unknown>) => Record<string, unknown>
    process: (result: Record<string, unknown>) => unknown
}

export class ServiceOrchestrator {
    private circuitBreakerState: Map<string, { failures: number; lastFailureTime: number }> = new Map()

    private async executeServiceCall(descriptor: ServiceDescriptor, input: Record<string, unknown>): Promise<Record<string, unknown>> {
        const { name, endpoint, auth, retryPolicy, circuitBreaker } = descriptor

        if (this.isCircuitOpen(name, circuitBreaker)) {
            throw new Error(`Circuit breaker open for service: ${name}`)
        }

        let attempts = 0
        let lastError: Error | null = null

        while (attempts < retryPolicy.maxAttempts) {
            try {
                const authenticatedInput = auth(input)
                // Simulate external API call
                const result: Record<string, unknown> = await this.callExternalApi(endpoint, authenticatedInput)

                this.recordSuccess(name)
                return result
            } catch (e) {
                lastError = e as Error
                attempts++

                if (attempts < retryPolicy.maxAttempts) {
                    const delay = retryPolicy.initialDelayMs * Math.pow(retryPolicy.multiplier, attempts - 1)
                    await setTimeout(delay)
                } else {
                    this.recordFailure(name)
                    throw new Error(`Service call failed after ${attempts} attempts: ${lastError.message}`)
                }
            }
        }
        throw new Error("Exhausted all retry attempts.")
    }

    private async callExternalApi(endpoint: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
        // Mock implementation for external API call
        if (Math.random() < 0.1) {
            throw new Error("Simulated network failure or API error")
        }
        return { status: "success", data: `Processed via ${endpoint}`, input: input }
    }

    private isCircuitOpen(serviceName: string, circuitBreaker: { failureThreshold: number; resetTimeoutMs: number }): boolean {
        const state = this.circuitBreakerState.get(serviceName)
        if (!state) return false

        const now = Date.now()
        if (now < state.lastFailureTime + circuitBreaker.resetTimeoutMs) {
            return state.failures >= circuitBreaker.failureThreshold
        }
        return false
    }

    private recordFailure(serviceName: string): void {
        const state = this.circuitBreakerState.get(serviceName) || { failures: 0, lastFailureTime: 0 }
        const now = Date.now()
        this.circuitBreakerState.set(serviceName, {
            failures: state.failures + 1,
            lastFailureTime: now
        })
    }

    private recordSuccess(serviceName: string): void {
        this.circuitBreakerState.delete(serviceName)
    }

    public async runWorkflow(steps: WorkflowStep[], initialContext: Record<string, unknown>): Promise<Record<string, unknown>> {
        let state: Record<string, unknown> = { ...initialContext }

        for (const step of steps) {
            try {
                const input = step.inputMapper(state)
                const result = await this.executeServiceCall(step.descriptor, input)
                const finalResult = step.process(result)

                state = { ...state, lastStepResult: finalResult }
            } catch (e) {
                throw new Error(`Workflow failed at step ${step.descriptor.name}: ${(e as Error).message}`)
            }
        }
        return state
    }
}