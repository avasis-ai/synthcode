import { EventEmitter } from "node:events";

export type Message = any;

export interface GateContext {
    sessionId: string;
    currentStep: string;
    metadata: Record<string, unknown>;
}

export type GateOutcome = "SUCCESS" | "FAILURE" | "TIMEOUT" | "MANUAL_OVERRIDE";

export interface CoordinationGate {
    awaitGate(context: GateContext): Promise<void>;
    resumeGate(outcome: GateOutcome, resultData?: Record<string, unknown>): void;
}

export class CoordinationGate implements CoordinationGate {
    private eventEmitter: EventEmitter;
    private context: GateContext | null = null;
    private outcomeResolver: ((outcome: GateOutcome, data: Record<string, unknown>) => void) | null = null;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    awaitGate(context: GateContext): Promise<void> {
        if (this.context) {
            throw new Error("Gate is already active. Must resolve current wait state first.");
        }

        this.context = context;
        console.log(`[CoordinationGate] Pausing execution for session ${context.sessionId}. Waiting for external signal...`);

        return new Promise((resolve, reject) => {
            this.outcomeResolver = (outcome: GateOutcome, data: Record<string, unknown>) => {
                if (outcome === "TIMEOUT") {
                    console.warn(`[CoordinationGate] Timeout occurred for session ${context.sessionId}.`);
                    resolve(undefined); // Resolve with undefined/null on timeout
                    return;
                }

                if (outcome === "SUCCESS" || outcome === "FAILURE" || outcome === "MANUAL_OVERRIDE") {
                    console.log(`[CoordinationGate] Received external signal: ${outcome} for session ${context.sessionId}.`);
                    // In a real system, this would trigger the next step/callback
                    resolve(undefined);
                }
            };

            // Listen for the external signal resolution
            this.eventEmitter.on("gate:resolve", (outcome: GateOutcome, data: Record<string, unknown>) => {
                this.outcomeResolver!(outcome, data);
                this.eventEmitter.removeListener("gate:resolve", this.outcomeResolver);
            });

            // Optional: Implement a timeout mechanism if not handled externally
            // For simplicity, we rely on the caller to manage the timeout logic or the event emitter.
        });
    }

    resumeGate(outcome: GateOutcome, resultData?: Record<string, unknown>): void {
        if (!this.context) {
            throw new Error("Gate is not currently active. Cannot resume.");
        }

        console.log(`[CoordinationGate] Emitting resolution event for session ${this.context.sessionId}.`);
        this.eventEmitter.emit("gate:resolve", outcome, resultData || {});

        // Clean up state after resolution
        this.context = null;
        this.outcomeResolver = null;
    }
}

export { CoordinationGate };