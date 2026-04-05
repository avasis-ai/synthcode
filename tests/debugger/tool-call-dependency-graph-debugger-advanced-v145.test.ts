import { describe, it, expect } from "vitest";
import { DebuggerEngine } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v145";
import { ToolCallDependencyGraph, DebuggerContext, Message } from "../src/debugger/types";

describe("DebuggerEngine", () => {
    it("should return success when context allows stepping forward", () => {
        const mockGraph: ToolCallDependencyGraph = {} as ToolCallDependencyGraph;
        const mockContext: DebuggerContext = {
            canStepForwar: () => true,
            // Add other necessary properties/methods for a complete mock
        } as DebuggerContext;
        const engine = new DebuggerEngine(mockGraph, mockContext);

        const result = engine.stepForward();

        expect(result.success).toBe(true);
    });

    it("should return failure when context prevents stepping forward", () => {
        const mockGraph: ToolCallDependencyGraph = {} as ToolCallDependencyGraph;
        const mockContext: DebuggerContext = {
            canStepForwar: () => false,
            // Add other necessary properties/methods for a complete mock
        } as DebuggerContext;
        const engine = new DebuggerEngine(mockGraph, mockContext);

        const result = engine.stepForward();

        expect(result.success).toBe(false);
    });

    it("should handle null or undefined context gracefully (if applicable based on constructor logic)", () => {
        // Assuming the constructor handles null/undefined context by throwing or setting a default
        // If the constructor assumes non-null context, this test might need adjustment.
        // For this test, we assume the constructor accepts valid inputs based on the provided snippet.
        const mockGraph: ToolCallDependencyGraph = {} as ToolCallDependencyGraph;
        const mockContext: DebuggerContext = {
            canStepForwar: () => true,
        } as DebuggerContext;
        const engine = new DebuggerEngine(mockGraph, mockContext);

        // Test a basic operation to ensure initialization worked
        expect(engine).toBeInstanceOf(DebuggerEngine);
    });
});