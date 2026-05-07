import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TimeoutError";
    }
}

export interface GateContext {
    initialContext: Record<string, unknown>;
    signalPayload: Record<string, unknown>;
    timestamp: number;
}

export class ExternalAcknowledgeGate {
    private readonly waiter: () => Promise<any>;
    private readonly timeoutMs: number;

    constructor(waiter: () => Promise<any>, timeoutMs: number): this {
        this.waiter = waiter;
        this.timeoutMs = timeoutMs;
    }

    public async waitForSignal(initialContext: Record<string, unknown>, currentPayload: Record<string, unknown>): Promise<{ payload: Record<string, unknown>; context: GateContext }> {
        const context: GateContext = {
            initialContext: initialContext,
            signalPayload: currentPayload,
            timestamp: Date.now(),
        };

        const timeoutPromise = new Promise<any>((_, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError(`External acknowledgement timed out after ${this.timeoutMs}ms.`));
            }, this.timeoutMs);
            // Clean up the timer if the main promise resolves or rejects first
            (timeoutPromise as any)._cleanup = () => clearTimeout(timer);
        });

        try {
            const signalPromise = this.waiter();

            const result = await Promise.race([
                signalPromise,
                timeoutPromise
            ]);

            const newContext: GateContext = {
                initialContext: context.initialContext,
                signalPayload: result,
                timestamp: Date.now(),
            };

            return {
                payload: result,
                context: newContext,
            };
        } catch (error) {
            throw error;
        }
    }
}

export { ExternalAcknowledgeGate, TimeoutError, GateContext }