enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN",
}

interface EndpointMetrics {
    successCount: number;
    failureCount: number;
    lastLatencyMs: number | null;
    lastFailureTime: number | null;
    lastSuccessfulCallTime: number;
}

export interface ServiceEndpoint {
    id: string;
    metrics: EndpointMetrics;
    state: CircuitState;
    failureThreshold: number;
    resetTimeoutMs: number;
    backupEndpointId?: string;
}

export class ServiceHealthMesh {
    private endpoints: Map<string, ServiceEndpoint>;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    constructor(failureThreshold: number = 3, resetTimeoutMs: number = 5000) {
        this.endpoints = new Map<string, ServiceEndpoint>();
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    private initializeEndpoint(id: string): ServiceEndpoint {
        if (!this.endpoints.has(id)) {
            return {
                id: id,
                metrics: {
                    successCount: 0,
                    failureCount: 0,
                    lastLatencyMs: null,
                    lastFailureTime: null,
                    lastSuccessfulCallTime: Date.now(),
                },
                state: CircuitState.CLOSED,
                failureThreshold: this.failureThreshold,
                resetTimeoutMs: this.resetTimeoutMs,
            };
        }
        return this.endpoints.get(id)!;
    }

    public registerEndpoint(id: string, backupEndpointId?: string): void {
        const endpoint = this.initializeEndpoint(id);
        this.endpoints.set(id, {
            ...endpoint,
            backupEndpointId: backupEndpointId
        });
    }

    private updateCircuitState(endpoint: ServiceEndpoint, success: boolean): ServiceEndpoint {
        const now = Date.now();
        const metrics = endpoint.metrics;

        if (success) {
            metrics.successCount += 1;
            metrics.failureCount = Math.max(0, metrics.failureCount - 1);
            metrics.lastLatencyMs = Math.round(metrics.lastLatencyMs ?? 0);
            metrics.lastSuccessfulCallTime = now;
            
            if (endpoint.state === CircuitState.OPEN) {
                // If we succeed in HALF_OPEN, close the circuit
                return { ...endpoint, state: CircuitState.CLOSED };
            }
            
            // If CLOSED, just reset failure count
            return { ...endpoint, metrics: { ...metrics, failureCount: 0 } };

        } else {
            metrics.failureCount += 1;
            metrics.lastFailureTime = now;

            if (endpoint.state === CircuitState.CLOSED && metrics.failureCount >= endpoint.failureThreshold) {
                // Trip the circuit
                return { ...endpoint, state: CircuitState.OPEN };
            }
            
            if (endpoint.state === CircuitState.HALF_OPEN) {
                // Fail in HALF_OPEN, immediately reopen
                return { ...endpoint, state: CircuitState.OPEN };
            }

            return { ...endpoint };
        }
    }

    public recordCall(endpointId: string, success: boolean, latencyMs: number): void {
        const endpoint = this.initializeEndpoint(endpointId);
        const updatedEndpoint = this.updateCircuitState(endpoint, success);
        this.endpoints.set(endpointId, updatedEndpoint);
    }

    public checkAvailability(endpointId: string): { available: boolean; state: CircuitState; } {
        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            return { available: false, state: CircuitState.OPEN };
        }

        const now = Date.now();
        let state = endpoint.state;

        if (state === CircuitState.OPEN) {
            const timeSinceFailure = now - (endpoint.metrics.lastFailureTime ?? 0);
            if (timeSinceFailure > endpoint.resetTimeoutMs) {
                state = CircuitState.HALF_OPEN;
            }
        }

        return { available: state !== CircuitState.OPEN, state: state };
    }

    public async routeCall<T>(endpointId: string, callFn: () => Promise<T>): Promise<T> {
        let endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            throw new Error(`Endpoint ${endpointId} not registered.`);
        }

        const { state: currentState } = this.checkAvailability(endpointId);

        if (currentState === CircuitState.OPEN) {
            throw new Error(`Circuit open for ${endpointId}. Failing fast.`);
        }

        let result: T;
        let success = false;
        let latency = 0;
        let attemptCount = 0;
        const maxAttempts = 2;

        while (attemptCount < maxAttempts) {
            attemptCount++;
            
            try {
                const startTime = Date.now();
                result = await callFn();
                latency = Date.now() - startTime;
                success = true;
                break;
            } catch (e) {
                success = false;
                latency = Date.now() - startTime;
                
                if (attemptCount < maxAttempts) {
                    // Exponential backoff simulation (simple wait)
                    await new Promise(resolve => setTimeout(resolve, 100 * attemptCount));
                } else {
                    throw new Error(`Failed after ${maxAttempts} attempts.`);
                }
            }
        }

        // Record the outcome of the attempt
        this.recordCall(endpointId, success, latency);

        if (!success) {
            if (endpoint.backupEndpointId) {
                const backupId = endpoint.backupEndpointId;
                console.warn(`Primary endpoint ${endpointId} failed. Attempting failover to ${backupId}.`);
                // Recursively call routeCall for failover
                return this.routeCall(backupId, callFn);
            } else {
                throw new Error(`Primary endpoint ${endpointId} failed and no backup configured.`);
            }
        }

        return result;
    }
}