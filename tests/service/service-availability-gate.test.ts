import { describe, it, expect, vi } from "vitest";
import { ServiceAvailabilityGate, ServiceState } from "../../../src/service/service-availability-gate";

describe("ServiceAvailabilityGate", () => {
    it("should initialize to CLOSED state and track initial counts", () => {
        const gate = new ServiceAvailabilityGate(3, 5000, 2);
        expect(gate.getState()).toBe(ServiceState.CLOSED);
        expect(gate.getFailureCount()).toBe(0);
        expect(gate.getSuccessCount()).toBe(0);
    });

    it("should transition to OPEN state after successful calls and remain OPEN until failure threshold is reached", async () => {
        const gate = new ServiceAvailabilityGate(3, 5000, 2);
        // Simulate successful calls to open the gate
        for (let i = 0; i < 3; i++) {
            await gate.recordSuccess();
        }
        expect(gate.getState()).toBe(ServiceState.OPEN);

        // Simulate a failure, which should keep it open if failure threshold isn't met
        await gate.recordFailure();
        expect(gate.getState()).toBe(ServiceState.OPEN);
    });

    it("should transition to CLOSED state after reaching failure threshold and attempt to reopen after timeout", async () => {
        const gate = new ServiceAvailabilityGate(3, 5000, 2);

        // 1. Fail enough times to close the gate
        for (let i = 0; i < 3; i++) {
            await gate.recordFailure();
        }
        expect(gate.getState()).toBe(ServiceState.CLOSED);

        // 2. Attempt to reopen (should fail)
        await gate.recordSuccess();
        expect(gate.getState()).toBe(ServiceState.CLOSED);

        // 3. Wait for timeout (simulated)
        vi.useFakeTimers();
        await vi.advanceTimersByTimeAsync(5000);
        vi.useRealTimers();

        // 4. Attempt to reopen after timeout (should transition to HALF_OPEN)
        await gate.recordSuccess();
        expect(gate.getState()).toBe(ServiceState.HALF_OPEN);
    });
});