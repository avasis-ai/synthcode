import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ServiceCallContext {
    callId: string;
    targetService: string;
    payload: Record<string, unknown>;
    metadata: {
        costEstimate: number;
        requiredCapabilities: string[];
        timeoutMs: number;
    };
}

interface ProxyResult<T> {
    success: boolean;
    data: T | null;
    message: string;
}

class ServiceMeshProxy {
    private readonly rateLimitStore: Map<string, number> = new Map();
    private readonly circuitBreakerState: Map<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'> = new Map();

    constructor() {
        this.circuitBreakerState.set("default", "CLOSED");
    }

    private checkHealth(context: ServiceCallContext): ProxyResult<void> {
        console.log(`[HealthCheck] Checking health for ${context.targetService}...`);
        // Simulate complex health check logic
        if (Math.random() < 0.05) {
            return { success: false, data: null, message: "Service is currently unhealthy." };
        }
        return { success: true, data: null, message: "Health check passed." };
    }

    private checkRateLimit(context: ServiceCallContext): ProxyResult<void> {
        const key = `${context.targetService}:${context.callId}`;
        const currentCount = this.rateLimitStore.get(key) || 0;
        const limit = 10;

        if (currentCount >= limit) {
            return { success: false, data: null, message: "Rate limit exceeded for this service." };
        }

        this.rateLimitStore.set(key, currentCount + 1);
        return { success: true, data: null, message: "Rate limit check passed." };
    }

    private checkCost(context: ServiceCallContext): ProxyResult<void> {
        const cost = context.metadata.costEstimate;
        const maxBudget = 100;

        if (cost > maxBudget) {
            return { success: false, data: null, message: `Cost estimate (${cost}) exceeds budget.` };
        }
        return { success: true, data: null, message: `Cost check passed. Estimated cost: ${cost}.` };
    }

    private checkCircuitBreaker(context: ServiceCallContext): ProxyResult<void> {
        const state = this.circuitBreakerState.get(context.targetService) || "CLOSED";

        if (state === "OPEN") {
            return { success: false, data: null, message: "Circuit breaker is open. Service is unavailable." };
        }
        if (state === "HALF_OPEN") {
            console.warn("[CircuitBreaker] Attempting half-open test call.");
        }
        return { success: true, data: null, message: `Circuit breaker state: ${state}.` };
    }

    private executeWithCircuitBreaker<T>(context: ServiceCallContext, action: (c: ServiceCallContext) => Promise<T>): Promise<ProxyResult<T>> {
        const serviceKey = context.targetService;
        const currentState = this.circuitBreakerState.get(serviceKey) || "CLOSED";

        if (currentState === "OPEN") {
            return Promise.resolve({ success: false, data: null, message: "Circuit is open." } as ProxyResult<T>);
        }

        return action(context).then(data => {
            // Success logic
            if (currentState === "HALF_OPEN") {
                this.circuitBreakerState.set(serviceKey, "CLOSED");
                console.log(`[CircuitBreaker] Service ${serviceKey} recovered. State -> CLOSED.`);
            }
            return { success: true, data, message: "Execution successful." } as ProxyResult<T>;
        }).catch(error => {
            // Failure logic
            console.error(`[CircuitBreaker] Failure detected for ${serviceKey}.`);
            if (currentState === "CLOSED") {
                this.circuitBreakerState.set(serviceKey, "OPEN");
                console.warn(`[CircuitBreaker] State changed to OPEN for ${serviceKey}.`);
            } else if (currentState === "HALF_OPEN") {
                this.circuitBreakerState.set(serviceKey, "OPEN");
                console.warn(`[CircuitBreaker] Failed test call. State changed to OPEN for ${serviceKey}.`);
            }
            return { success: false, data: null, message: `Execution failed: ${(error as Error).message}` } as ProxyResult<T>;
        });
    }

    private dynamicRoute(context: ServiceCallContext): ProxyResult<string> {
        // Simple routing logic based on payload content
        const payloadString = JSON.stringify(context.payload).toLowerCase();
        let target = "default_endpoint";

        if (payloadString.includes("premium") && context.metadata.costEstimate > 50) {
            target = "premium_endpoint";
        } else if (payloadString.includes("user_id")) {
            target = "user_specific_endpoint";
        }

        return { success: true, data: target, message: `Routed to ${target}.` };
    }

    public async execute<T>(context: ServiceCallContext, serviceCall: (c: ServiceCallContext) => Promise<T>): Promise<ProxyResult<T>> {
        console.log("--- Starting Service Mesh Proxy Execution ---");

        // 1. Sequential Policy Checks (Synchronous Fail Fast)
        const checks: [ServiceCallContext] => ProxyResult<void>[] = [
            (c) => this.checkHealth(c),
            (c) => this.checkRateLimit(c),
            (c) => this.checkCost(c),
            (c) => this.checkCircuitBreaker(c),
        ];

        for (const check of checks) {
            const result = check(context);
            if (!result.success) {
                console.error(`[Proxy Fail] Policy check failed: ${result.message}`);
                return { success: false, data: null, message: `Policy failure: ${result.message}` } as ProxyResult<T>;
            }
        }

        // 2. Dynamic Routing Check
        let routeResult = this.dynamicRoute(context);
        if (!routeResult.success) {
            return { success: false, data: null, message: `Routing failure: ${routeResult.message}` } as ProxyResult<T>;
        }

        // 3. Execution with Resilience (Asynchronous)
        try {
            const finalResult = await this.executeWithCircuitBreaker(context, serviceCall);
            return finalResult;
        } catch (e) {
            return { success: false, data: null, message: `Critical execution error: ${(e as Error).message}` } as ProxyResult<T>;
        }
    }
}

export { ServiceMeshProxy };