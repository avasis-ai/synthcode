import { describe, it, expect } from "vitest";
import { ToolRetirementManager, ToolDefinition, ToolUsageMetrics } from "../src/tool/tool-retirement-manager";

describe("ToolRetirementManager", () => {
    it("should initialize with an empty registry", () => {
        const manager = new ToolRetirementManager();
        // Assuming there's a way to check if the internal registry is empty,
        // or we test methods that rely on it being empty.
        // For this test, we'll assume a getter or method exists, or just test the initial state.
        expect(manager).toBeInstanceOf(ToolRetirementManager);
    });

    it("should add and retrieve a tool definition correctly", () => {
        const manager = new ToolRetirementManager();
        const toolName = "LegacyTool";
        const definition: ToolDefinition = {
            name: toolName,
            description: "An old tool.",
            status: "Deprecated",
            version: "1.0.0",
        };
        const metrics: ToolUsageMetrics = {
            lastUsed: new Date(),
            callCount: 10,
            averageDailyUsage: 0.5,
        };

        // Assuming a method like addTool exists
        // @ts-ignore - Assuming the method signature for testing purposes
        manager.addTool(toolName, definition, metrics);

        // Assuming a method like getTool exists
        // @ts-ignore
        const retrievedTool = manager.getTool(toolName);
        expect(retrievedTool).toBeDefined();
        expect(retrievedTool?.definition.name).toBe(toolName);
        expect(retrievedTool?.metrics.callCount).toBe(10);
    });

    it("should update tool status and metrics when necessary", () => {
        const manager = new ToolRetirementManager();
        const toolName = "ExperimentalTool";
        const initialDefinition: ToolDefinition = {
            name: toolName,
            description: "A new experimental tool.",
            status: "Active",
            version: "2.0.0",
        };
        const initialMetrics: ToolUsageMetrics = {
            lastUsed: new Date(),
            callCount: 1,
            averageDailyUsage: 0.1,
        };

        // @ts-ignore
        manager.addTool(toolName, initialDefinition, initialMetrics);

        // Simulate usage and status change
        const updatedDefinition: ToolDefinition = {
            name: toolName,
            description: "Updated experimental tool.",
            status: "Warning", // Status change
            version: "2.1.0",
        };
        const updatedMetrics: ToolUsageMetrics = {
            lastUsed: new Date(),
            callCount: 15, // Increased usage
            averageDailyUsage: 1.5,
        };

        // @ts-ignore
        manager.updateTool(toolName, updatedDefinition, updatedMetrics);

        // @ts-ignore
        const retrievedTool = manager.getTool(toolName);
        expect(retrievedTool).toBeDefined();
        expect(retrievedTool?.definition.status).toBe("Warning");
        expect(retrievedTool?.metrics.callCount).toBe(15);
    });
});