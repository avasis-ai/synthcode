import { describe, it, expect, vi } from "vitest";
import { ServiceEndpoint, CircuitState } from "../src/health/service-health-mesh";

describe("ServiceHealthMesh", () => {
    it("should initialize correctly with default states and metrics", () => {
        const endpoint: ServiceEndpoint = {
            id: "service-a",
            metrics: {
                successCount: 10,
                failureCount: 2,
                lastLatencyMs: 50,
                lastFailureTime: null,
                lastSuccessfulCallTime: Date.now(),
            },
            state: CircuitState.CLOSED,
            failureThreshold: 5,
            resetTimeoutMs: 60000,
        };

        const mesh = new ServiceHealthMesh([endpoint]);

        expect(mesh.getEndpoints().length).toBe(1);
        expect(mesh.getEndpoints()[0].id).toBe("service-a");
        expect(mesh.getEndpoints()[0].state).toBe(CircuitState.CLOSED);
    });

    it("should transition state to OPEN after exceeding failure threshold", () => {
        const endpoint: ServiceEndpoint = {
            id: "service-b",
            metrics: {
                successCount: 0,
                failureCount: 0,
                lastLatencyMs: null,
                lastFailureTime: null,
                lastSuccessfulCallTime: Date.now(),
            },
            state: CircuitState.CLOSED,
            failureThreshold: 3,
            resetTimeoutMs: 1000,
        };

        const mesh = new ServiceHealthMesh([endpoint]);

        // Simulate failures until OPEN
        for (let i = 0; i < 4; i++) {
            mesh.recordFailure("service-b");
        }

        const updatedEndpoint = mesh.getEndpoints().find(e => e.id === "service-b")!;
        expect(updatedEndpoint.state).toBe(CircuitState.OPEN);
    });

    it("should transition state to HALF_OPEN after reset timeout expires", async () => {
        const endpoint: ServiceEndpoint = {
            id: "service-c",
            metrics: {
                successCount: 10,
                failureCount: 5,
                lastLatencyMs: 100,
                lastFailureTime: Date.now(),
                lastSuccessfulCallTime: Date.now(),
            },
            state: CircuitState.OPEN,
            failureThreshold: 3,
            resetTimeoutMs: 100,
        };

        const mesh = new ServiceHealthMesh([endpoint]);

        // Fast-forward time to expire the timeout
        vi.useFakeTimers();
        await vi.advanceTimersByTimeAsync(150);

        // Check if the state transitioned to HALF_OPEN
        const updatedEndpoint = mesh.getEndpoints().find(e => e.id === "service-c")!;
        expect(updatedEndpoint.state).toBe(CircuitState.HALF_OPEN);
    });
});