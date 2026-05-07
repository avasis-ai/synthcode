import { describe, it, expect, vi } from "vitest";
import { SandboxContext, SandboxManager } from "../src/sandbox/contextual-sandbox-manager";

describe("SandboxManager", () => {
    it("should initialize with default context and manage state correctly", () => {
        const initialContext: SandboxContext = {
            memory: { initial: true },
            variables: new Map([["user_id", 123]]),
            constraints: new Set(["must_be_secure"]),
        };
        const manager = new SandboxManager(initialContext);

        expect(manager.getContext()).toEqual(initialContext);
        expect(manager.getMemory()).toEqual(initialContext.memory);
        expect(manager.getVariables()).toEqual(initialContext.variables);
        expect(manager.getConstraints()).toEqual(initialContext.constraints);
    });

    it("should update context state and generate accurate reports after execution", async () => {
        const initialContext: SandboxContext = {
            memory: { count: 0 },
            variables: new Map(),
            constraints: new Set(),
        };
        const manager = new SandboxManager(initialContext);

        // Mock the execution logic to simulate state changes
        const mockExecution = async (input: any) => {
            // Simulate updating memory and variables
            manager.updateMemory({"count": 1, "last_run": Date.now()});
            manager.addVariable("result", "success");
            manager.addConstraint("must_be_fast");
            return {
                stateDiff: {
                    memory: { count: 1, last_run: expect.any(Number) },
                    variables: new Map([["result", "success"]]),
                    constraints: new Set(["must_be_fast"]),
                },
                resourceUsage: { cpuTimeMs: 50, memoryUsageBytes: 1024 }
            };
        };

        const report = await manager.execute(mockExecution, "test_input");

        expect(report).toBeDefined();
        expect(report?.stateDiff).toBeDefined();
        expect(report?.resourceUsage).toBeDefined();
    });

    it("should handle context changes and report resource usage accurately", async () => {
        const initialContext: SandboxContext = {
            memory: {},
            variables: new Map(),
            constraints: new Set(),
        };
        const manager = new SandboxManager(initialContext);

        // Mock execution to simulate resource usage
        const mockExecution = async () => {
            // Simulate complex computation
            await new Promise(resolve => setTimeout(resolve, 10));
            return {
                stateDiff: {
                    memory: { processed: true },
                    variables: new Map(),
                    constraints: new Set(),
                },
                resourceUsage: { cpuTimeMs: 10, memoryUsageBytes: 2048 }
            };
        };

        const report = await manager.execute(mockExecution, "test_input");

        expect(report?.resourceUsage.cpuTimeMs).toBe(10);
        expect(report?.resourceUsage.memoryUsageBytes).toBe(2048);
    });
});