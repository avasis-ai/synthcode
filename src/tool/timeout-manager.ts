import { EventEmitter } from "events";

export type ToolCall = {
    id: string;
    name: string;
    input: Record<string, unknown>;
};

export type ToolResult = {
    success: boolean;
    output: string;
};

export interface ToolInvocationContext {
    toolCall: ToolCall;
    // Add other context properties as needed
}

export class TimeoutError extends Error {
    constructor(message: string = "Tool call timed out") {
        super(message);
        this.name = "TimeoutError";
    }
}

export class TimeoutManager {
    private readonly defaultTimeoutMs: number;

    constructor(defaultTimeoutMs: number = 10000) {
        this.defaultTimeoutMs = defaultTimeoutMs;
    }

    public async executeWithTimeout(
        toolCall: ToolCall,
        context: ToolInvocationContext,
        timeoutMs?: number
    ): Promise<ToolResult> {
        const effectiveTimeoutMs = timeoutMs ?? this.defaultTimeoutMs;

        const timeoutPromise = new Promise<ToolResult>((_, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new TimeoutError());
            }, effectiveTimeoutMs);
            // In a real scenario, we might need a way to clear this timeout if the main promise resolves early.
            // For this simulation, we rely on the race structure.
        });

        return Promise.race([
            this.executeToolCall(toolCall, context),
            timeoutPromise
        ]);
    }

    private async executeToolCall(
        toolCall: ToolCall,
        context: ToolInvocationContext
    ): Promise<ToolResult> {
        // Simulate the actual asynchronous tool execution logic.
        // In a real system, this would call the actual tool executor.
        console.log(`Executing tool call ${toolCall.id} (${toolCall.name})...`);

        return new Promise((resolve) => {
            // Simulate work that might take time
            const simulatedDelay = Math.random() * 5000;

            setTimeout(() => {
                if (Math.random() < 0.1) {
                    // Simulate occasional failure
                    resolve({ success: false, output: "Simulated tool failure." });
                } else {
                    resolve({ success: true, output: `Successfully executed ${toolCall.name} with input: ${JSON.stringify(toolCall.input)}` });
                }
            }, simulatedDelay);
        });
    }
}