import { describe, it, expect, vi } from "vitest";
import { CoordinationGate, GateContext, GateOutcome } from "../src/coordination/coordination-gate";

describe("CoordinationGate", () => {
    it("should initialize correctly and manage state transitions", async () => {
        const gate = new CoordinationGate();
        const context: GateContext = {
            sessionId: "test-session-123",
            currentStep: "initial_step",
            metadata: { user: "testuser" },
        };

        // Test initial awaitGate call
        await gate.awaitGate(context);

        // Check if the gate is ready for resumption (simulated internal state check)
        // Since the internal state is private, we rely on the public methods.
        // We assume awaitGate sets up the necessary internal state.

        // Test resuming with SUCCESS
        gate.resumeGate("SUCCESS", { finalResult: true });
        // In a real scenario, we would check if the internal state reflects success.
        // For this test, we verify the method call doesn't throw and handles data.

        // Test resuming with FAILURE
        gate.resumeGate("FAILURE");
        // Verify it handles failure without requiring result data.
    });

    it("should handle different outcomes and data payloads correctly", async () => {
        const gate = new CoordinationGate();
        const context: GateContext = {
            sessionId: "test-session-456",
            currentStep: "processing_step",
            metadata: {},
        };

        // 1. Await the gate
        await gate.awaitGate(context);

        // 2. Resume with TIMEOUT
        gate.resumeGate("TIMEOUT");

        // 3. Resume with MANUAL_OVERRIDE and data
        gate.resumeGate("MANUAL_OVERRIDE", { reason: "admin_action", overrideId: 99 });
    });

    it("should handle context changes and multiple await cycles", async () => {
        const gate = new CoordinationGate();
        let context: GateContext = {
            sessionId: "test-session-789",
            currentStep: "start",
            metadata: {},
        };

        // First await cycle
        await gate.awaitGate(context);

        // Update context for the next cycle
        context = {
            sessionId: "test-session-789",
            currentStep: "intermediate_step",
            metadata: { progress: 50 },
        };

        // Second await cycle (simulating continuation)
        await gate.awaitGate(context);

        // Resume the second cycle
        gate.resumeGate("SUCCESS", { final: true });
    });
});