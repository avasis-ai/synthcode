import { describe, it, expect } from "vitest";
import {
    StructuredToolCallValidationChainBuilderV124Advanced
} from "../src/validation/structured-tool-call-validation-chain-builder-v124-advanced";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("StructuredToolCallValidationChainBuilderV124Advanced", () => {
    it("should correctly validate a simple successful tool call scenario", async () => {
        const message: Message = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Please call the weather tool for London.",
                }
            ]
        };
        const toolCalls: ToolUseBlock[] = [{
            toolName: "get_weather",
            toolCallId: "call_123",
            args: {
                location: "London"
            }
        }];

        const builder = new StructuredToolCallValidationChainBuilderV124Advanced();
        const result = await builder.buildAndValidate(message, toolCalls);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.context).toHaveProperty("validatedToolCalls");
    });

    it("should detect missing required arguments for a tool call", async () => {
        const message: Message = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "What is the capital of France?",
                }
            ]
        };
        const toolCalls: ToolUseBlock[] = [{
            toolName: "get_location_info",
            toolCallId: "call_456",
            args: {
                // Missing required argument 'country'
                city: "Paris"
            }
        }];

        const builder = new StructuredToolCallValidationChainBuilderV124Advanced();
        const result = await builder.buildAndValidate(message, toolCalls);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expect.arrayContaining([
            "The 'get_location_info' tool requires the 'country' argument."
        ]));
    });

    it("should handle multiple tool calls and validate them all", async () => {
        const message: Message = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Check the weather in Paris and get the population of Tokyo."
                }
            ]
        };
        const toolCalls: ToolUseBlock[] = [{
            toolName: "get_weather",
            toolCallId: "call_1",
            args: {
                location: "Paris"
            }
        }, {
            toolName: "get_population",
            toolCallId: "call_2",
            args: {
                city: "Tokyo"
            }
        }];

        const builder = new StructuredToolCallValidationChainBuilderV124Advanced();
        const result = await builder.buildAndValidate(message, toolCalls);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.context).toHaveProperty("validatedToolCalls");
        expect((result.context.validatedToolCalls as any[]).length).toBe(2);
    });
});