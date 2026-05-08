import { describe, it, expect } from "vitest";
import { OperationalContextualToolSelector } from "../src/selection/operational-contextual-tool-selector.js";

describe("OperationalContextualToolSelector", () => {
    it("should select a tool when all constraints are met by the best candidate", async () => {
        const selector = new OperationalContextualToolSelector();
        const context: OperationalContext = {
            maxLatencyMs: 500,
            minSecurityScore: 0.8,
            requiredResourceType: "image",
            computationalBudget: 100,
        };
        const tools = [
            { name: "ToolA", description: "A good tool", operationalRequirements: { maxLatencyMs: 400, minSecurityScore: 0.9, requiredResourceType: "image", computationalBudget: 80 } },
            { name: "ToolB", description: "Too slow", operationalRequirements: { maxLatencyMs: 600, minSecurityScore: 0.9, requiredResourceType: "image", computationalBudget: 80 } },
        ];

        const selectedTool = await selector.selectTool(context, tools);
        expect(selectedTool?.name).toBe("ToolA");
    });

    it("should return null when no available tool meets the minimum security score requirement", async () => {
        const selector = new OperationalContextualToolSelector();
        const context: OperationalContext = {
            maxLatencyMs: 500,
            minSecurityScore: 0.9,
            requiredResourceType: "text",
            computationalBudget: 100,
        };
        const tools = [
            { name: "ToolX", description: "Low security", operationalRequirements: { maxLatencyMs: 100, minSecurityScore: 0.7, requiredResourceType: "text", computationalBudget: 50 } },
            { name: "ToolY", description: "Also low security", operationalRequirements: { maxLatencyMs: 200, minSecurityScore: 0.8, requiredResourceType: "text", computationalBudget: 50 } },
        ];

        const selectedTool = await selector.selectTool(context, tools);
        expect(selectedTool).toBeNull();
    });

    it("should select the tool with the lowest latency when multiple tools are viable", async () => {
        const selector = new OperationalContextualToolSelector();
        const context: OperationalContext = {
            maxLatencyMs: 1000,
            minSecurityScore: 0.5,
            requiredResourceType: "data",
            computationalBudget: 500,
        };
        const tools = [
            { name: "ToolFast", description: "Fastest", operationalRequirements: { maxLatencyMs: 100, minSecurityScore: 0.6, requiredResourceType: "data", computationalBudget: 100 } },
            { name: "ToolMedium", description: "Medium speed", operationalRequirements: { maxLatencyMs: 500, minSecurityScore: 0.6, requiredResourceType: "data", computationalBudget: 100 } },
            { name: "ToolSlow", description: "Slowest", operationalRequirements: { maxLatencyMs: 800, minSecurityScore: 0.6, requiredResourceType: "data", computationalBudget: 100 } },
        ];

        const selectedTool = await selector.selectTool(context, tools);
        expect(selectedTool?.name).toBe("ToolFast");
    });
});