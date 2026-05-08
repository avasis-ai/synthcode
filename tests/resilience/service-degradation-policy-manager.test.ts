import { describe, it, expect, vi } from "vitest";
import { ServiceDegradationPolicyManager } from "../src/resilience/service-degradation-policy-manager";

describe("ServiceDegradationPolicyManager", () => {
    it("should initialize with correct thresholds and state", () => {
        const failureThreshold = 3;
        const resetTimeoutMs = 1000;
        const manager = new ServiceDegradationPolicyManager(failureThreshold, resetTimeoutMs);

        expect(manager.getFailureThreshold()).toBe(failureThreshold);
        expect(manager.getResetTimeoutMs()).toBe(resetTimeoutMs);
        expect(manager.getCurrentState()).toBe("CLOSED");
    });

    it("should transition to DEGRADED state after exceeding failure threshold", async () => {
        const failureThreshold = 2;
        const resetTimeoutMs = 1000;
        const manager = new ServiceDegradationPolicyManager(failureThreshold, resetTimeoutMs);

        // Simulate failures up to the threshold
        for (let i = 1; i <= failureThreshold; i++) {
            await manager.recordFailure();
            expect(manager.getCurrentState()).toBe("CLOSED"); // Should still be closed before the final failure
        }

        // The failure that crosses the threshold
        await manager.recordFailure();
        expect(manager.getCurrentState()).toBe("DEGRADED");
    });

    it("should transition back to CLOSED state after reset timeout expires in DEGRADED state", async () => {
        const failureThreshold = 2;
        const resetTimeoutMs = 50;
        const manager = new ServiceDegradationPolicyManager(failureThreshold, resetTimeoutMs);

        // 1. Force transition to DEGRADED state
        for (let i = 1; i <= failureThreshold; i++) {
            await manager.recordFailure();
        }
        await manager.recordFailure();
        expect(manager.getCurrentState()).toBe("DEGRADED");

        // 2. Wait for the reset timeout
        await new Promise(resolve => setTimeout(resolve, resetTimeoutMs + 10));

        // 3. Check if the state has reset
        expect(manager.getCurrentState()).toBe("CLOSED");
    });
});