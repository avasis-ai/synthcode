import { describe, it, expect, vi } from "vitest";
import { ToolIntegrationPipeline } from "../src/integration/tool-integration-pipeline";
import { ToolDefinition, ToolSchema, ToolIntegrationResult } from "../src/integration/types";

describe("ToolIntegrationPipeline", () => {
    it("should successfully process a valid tool definition and schema", async () => {
        const mockDefinition: ToolDefinition = {
            name: "test-tool",
            description: "A test tool.",
            parameters: {
                type: "object",
                properties: {
                    input: { type: "string" }
                },
                required: ["input"]
            }
        };
        const mockSchema: ToolSchema = {
            type: "object",
            properties: {
                input: { type: "string" }
            }
        };

        const pipeline = new ToolIntegrationPipeline();
        const result: ToolIntegrationResult = await pipeline.process(mockDefinition, mockSchema);

        expect(result.success).toBe(true);
        expect(result.mappedDefinition).toEqual(mockDefinition); // Assuming mapping doesn't change it for simplicity
        expect(result.message).toContain("Successfully processed");
    });

    it("should throw an error if the tool definition is missing", async () => {
        const mockSchema: ToolSchema = { type: "object", properties: {} };
        const pipeline = new ToolIntegrationPipeline();

        await expect(
            () => pipeline.process(null as unknown as ToolDefinition, mockSchema)
        ).rejects.toThrow("Tool definition must be provided");
    });

    it("should throw an error if the tool schema is missing", async () => {
        const mockDefinition: ToolDefinition = {
            name: "test-tool",
            description: "A test tool.",
            parameters: { type: "object", properties: {} }
        };
        const pipeline = new ToolIntegrationPipeline();

        await expect(
            () => pipeline.process(mockDefinition, null as unknown as ToolSchema)
        ).rejects.toThrow("Tool schema must be provided");
    });
});