import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types.js";

interface ServiceMetadata {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    schema: Record<string, any>;
}

interface CircuitBreaker {
    execute<T>(action: () => Promise<T>): Promise<T>;
}

interface RetryManager {
    execute<T>(
        action: () => Promise<T>,
        maxRetries: number,
        initialDelayMs: number
    ): Promise<T>;
}

export class ServiceCallGateway {
    private circuitBreaker: CircuitBreaker;
    private retryManager: RetryManager;

    constructor(
        circuitBreaker: CircuitBreaker,
        retryManager: RetryManager
    ) {
        this.circuitBreaker = circuitBreaker;
        this.retryManager = retryManager;
    }

    private enrichContext(payload: Record<string, unknown>): Record<string, unknown> {
        const context: Record<string, unknown> = {
            ...payload,
            context: {
                timestamp: Date.now(),
                source: "ServiceCallGateway",
            }
        };
        return context;
    }

    private async performApiCall(
        metadata: ServiceMetadata,
        enrichedPayload: Record<string, unknown>
    ): Promise<any> {
        console.log(`[Gateway] Calling ${metadata.url} using ${metadata.method} with payload:`, enrichedPayload);

        // Simulate network delay and API interaction
        await new Promise(resolve => setTimeout(resolve, 50));

        if (metadata.url.includes("fail")) {
            throw new Error("Simulated API Failure");
        }

        return {
            status: "success",
            data: {
                message: `Successfully processed request for ${metadata.schema.name}`,
                result: enrichedPayload
            }
        };
    }

    public async execute(
        serviceId: string,
        metadata: ServiceMetadata,
        payload: Record<string, unknown>
    ): Promise<any> {
        const enrichedPayload = this.enrichContext(payload);

        const callAction = () => this.performApiCall(metadata, enrichedPayload);

        try {
            const result = await this.circuitBreaker.execute(async () => {
                return this.retryManager.execute(
                    callAction,
                    3,
                    100
                );
            });
            return result;
        } catch (error) {
            console.error(`[Gateway] Failed to execute service ${serviceId} after all retries and circuit checks.`, error);
            throw new Error(`Service call failed for ${serviceId}: ${(error as Error).message}`);
        }
    }
}