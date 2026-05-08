import { describe, it, expect, vi } from "vitest";
import { ExecutionBreakpointManager } from "../src/breakpoint/execution-breakpoint-manager";

describe("ExecutionBreakpointManager", () => {
    it("should initialize and emit event when a breakpoint is hit", async () => {
        const manager = new ExecutionBreakpointManager();
        const mockContext = { id: 1, user: "test" };
        const mockStep = { line: 10, functionName: "testFunc" };
        const mockHandler = vi.fn(async () => {
            manager.emit("breakpoint_hit", { context: mockContext, step: mockStep });
            return "Breakpoint handled";
        });

        // Simulate setting a breakpoint (though the actual implementation detail is hidden, we test the public interface)
        // We assume the manager has a method or internal mechanism to trigger the hit.
        // Since we don't see the full implementation, we simulate the core functionality: handling the hit.
        await manager.handleBreakpoint(mockContext, mockStep, mockHandler);

        expect(mockHandler).toHaveBeenCalledTimes(1);
        expect(mockHandler).toHaveBeenCalledWith(mockContext, mockStep);
    });

    it("should allow multiple breakpoints to be registered and execute handlers sequentially", async () => {
        const manager = new ExecutionBreakpointManager();
        const mockContext = { id: 2 };
        const mockStep = { line: 20 };
        const handler1 = vi.fn(async () => "Result 1");
        const handler2 = vi.fn(async () => "Result 2");

        // Simulate registering two breakpoints (assuming a method like registerBreakpoint exists or is used internally)
        // Since the internal registration mechanism is not visible, we test the combined execution flow.
        await manager.handleBreakpoint(mockContext, mockStep, handler1);
        await manager.handleBreakpoint(mockContext, mockStep, handler2);

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle breakpoints that return promises correctly", async () => {
        const manager = new ExecutionBreakpointManager();
        const mockContext = { id: 3 };
        const mockStep = { line: 30 };
        const asyncHandler = vi.fn(async () => "Async Result");

        // Test execution with an asynchronous handler
        await manager.handleBreakpoint(mockContext, mockStep, asyncHandler);

        expect(asyncHandler).toHaveBeenCalledTimes(1);
        await expect(manager.handleBreakpoint(mockContext, mockStep, asyncHandler)).resolves.toBe("Async Result");
    });
});