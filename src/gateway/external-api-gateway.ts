interface ExternalApiConfig {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers: Record<string, string>;
    auth: {
        type: "API_KEY" | "BASIC" | "OAUTH";
        credentials: string | Record<string, string>;
    };
    schema: {
        request?: Record<string, unknown>;
        response?: Record<string, unknown>;
    };
    fallback?: (error: Error) => Promise<unknown>;
    maxRetries?: number;
}

type ApiResult<T> = {
    success: boolean;
    data: T | null;
    error: Error | null;
    metadata: Record<string, unknown>;
};

class CircuitBreaker {
    private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    constructor(failureThreshold: number = 3, resetTimeoutMs: number = 5000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    isAllowed(): boolean {
        if (this.state === "OPEN") {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > this.resetTimeoutMs) {
                this.state = "HALF_OPEN";
                return true;
            }
            return false;
        }
        return true;
    }

    recordSuccess(): void {
        if (this.state !== "CLOSED") {
            this.state = "CLOSED";
            this.failureCount = 0;
            console.log("Circuit Breaker: Closed");
        }
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
            this.state = "OPEN";
            console.warn("Circuit Breaker: Opened");
        } else if (this.state === "CLOSED") {
            console.warn(`Circuit Breaker: Failure count ${this.failureCount}/${this.failureThreshold}`);
        }
    }

    getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
        return this.state;
    }
}

class RateLimiter {
    private limit: number;
    private windowMs: number;
    private requestTimestamps: number[] = [];

    constructor(limit: number = 5, windowMs: number = 10000) {
        this.limit = limit;
        this.windowMs = windowMs;
    }

    canProceed(): boolean {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > now - this.windowMs);

        if (this.requestTimestamps.length < this.limit) {
            this.requestTimestamps.push(now);
            return true;
        }
        return false;
    }
}

class ExternalApiGateway {
    private readonly serviceName: string;
    private readonly config: ExternalApiConfig;
    private readonly circuitBreaker: CircuitBreaker;
    private readonly rateLimiter: RateLimiter;

    constructor(serviceName: string, config: ExternalApiConfig) {
        this.serviceName = serviceName;
        this.config = config;
        this.circuitBreaker = new CircuitBreaker();
        this.rateLimiter = new RateLimiter(5, 10000);
    }

    private async executeRequest(body: Record<string, unknown>): Promise<any> {
        const url = this.config.endpoint;
        const method = this.config.method;
        const headers = {
            ...this.config.headers,
            'Content-Type': 'application/json',
        };

        let fetchOptions: RequestInit = {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        if (this.config.auth.type === "API_KEY") {
            fetchOptions.headers['Authorization'] = `Bearer ${this.config.auth.credentials as string}`;
        } else if (this.config.auth.type === "BASIC") {
            fetchOptions.headers['Authorization'] = `Basic ${this.config.auth.credentials as string}`;
        }

        // Mocking fetch for environment independence
        console.log(`[MOCK HTTP] Calling ${method} ${url}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency

        if (Math.random() < 0.1) {
            throw new Error("Simulated 500 Internal Server Error");
        }

        return {
            ok: true,
            status: 200,
            json: async () => ({ data: "mock_response_data" }),
        };
    }

    private validateResponse(data: unknown, schema: Record<string, unknown>): { isValid: boolean; message: string } {
        // Simplified schema validation mock
        if (!schema) return { isValid: true, message: "No schema provided." };
        if (typeof data !== 'object' || data === null) return { isValid: false, message: "Response must be an object." };
        
        // Basic check: ensure required keys exist
        for (const key in schema) {
            if (!(key in data)) {
                return { isValid: false, message: `Missing required field: ${key}` };
            }
        }
        return { isValid: true, message: "Schema validation passed." };
    }

    public async call(requestBody: Record<string, unknown> = {}): Promise<ApiResult<unknown>> {
        if (!this.circuitBreaker.isAllowed()) {
            return {
                success: false,
                data: null,
                error: new Error("Service unavailable: Circuit Breaker is open."),
                metadata: { service: this.serviceName }
            };
        }

        if (!this.rateLimiter.canProceed()) {
            return {
                success: false,
                data: null,
                error: new Error("Rate limit exceeded for this service."),
                metadata: { service: this.serviceName }
            };
        }

        let lastError: Error | null = null;
        let attempt = 0;
        const maxRetries = this.config.maxRetries ?? 3;

        while (attempt <= maxRetries) {
            try {
                const response = await this.executeRequest(requestBody);
                const rawData = await response.json();

                const validation = this.validateResponse(rawData, this.config.schema?.response);

                if (!validation.isValid) {
                    throw new Error(`Schema validation failed: ${validation.message}`);
                }

                this.circuitBreaker.recordSuccess();
                return {
                    success: true,
                    data: rawData,
                    error: null,
                    metadata: { service: this.serviceName, attempt: attempt + 1 }
                };

            } catch (e) {
                const error = e as Error;
                lastError = error;
                attempt++;

                this.circuitBreaker.recordFailure();

                if (attempt > maxRetries) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
            }
        }

        // Fallback execution
        const finalError = lastError || new Error("Unknown API call failure.");
        const fallbackResult = this.config.fallback ? await this.config.fallback(finalError) : null;

        return {
            success: false,
            data: fallbackResult,
            error: finalError,
            metadata: { service: this.serviceName, attempts: attempt }
        };
    }
}

export { ExternalApiGateway, ExternalApiConfig, ApiResult };