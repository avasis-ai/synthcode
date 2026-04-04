import { describe, it, expect, vi } from "vitest";
import { StructuredOutputParser } from "../src/structured-output-parser";

describe("StructuredOutputParser", () => {
    it("should correctly parse a simple JSON object structure", async () => {
        const mockLlmCall = vi.fn().mockResolvedValue(
            '{"name": "Test", "age": 30}'
        );
        const parser = new StructuredOutputParser(mockLlmCall);

        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name", "age"],
        };

        const result = await parser.parse<any>(
            "Extract user details from the text.",
            schema
        );

        expect(mockLlmCall).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            name: "Test",
            age: 30,
        });
    });

    it("should handle missing optional fields gracefully", async () => {
        const mockLlmCall = vi.fn().mockResolvedValue(
            '{"name": "Jane", "email": "jane@example.com"}'
        );
        const parser = new StructuredOutputParser(mockLlmCall);

        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                email: { type: "string", description: "User's email address" },
                phone: { type: "string", description: "User's phone number (optional)" },
            },
            required: ["name"],
        };

        const result = await parser.parse<any>(
            "Extract user details from the text.",
            schema
        );

        expect(mockLlmCall).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            name: "Jane",
            email: "jane@example.com",
            phone: undefined,
        });
    });

    it("should throw an error if the LLM output is not valid JSON", async () => {
        const mockLlmCall = vi.fn().mockResolvedValue(
            '{"name": "Incomplete JSON"'
        );
        const parser = new StructuredOutputParser(mockLlmCall);

        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
            },
            required: ["name"],
        };

        await expect(parser.parse("Test prompt", schema)).rejects.toThrow(
            /Invalid JSON/
        );
    });
});