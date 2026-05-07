import { describe, it, expect } from "vitest";
import { SemanticHandshakeValidator } from "../src/validation/semantic-handshake-validator";

describe("SemanticHandshakeValidator", () => {
    it("should validate a successful semantic handshake", async () => {
        const validator = new SemanticHandshakeValidator();
        const previousOutput = {
            user_id: "u123",
            data: {
                email: "test@example.com",
                name: "John Doe",
            },
        };
        const stepContext = {
            stepName: "ProcessUserData",
            requiredInputSchema: {
                user_id: "string",
                data: {
                    email: "string",
                    name: "string",
                },
            },
            semanticExpectation: "The output must contain user identification and contact details.",
        };

        const result = await validator.validate(
            previousOutput,
            stepContext
        );

        expect(result).toBe(true);
    });

    it("should fail validation when semantic expectations are not met", async () => {
        const validator = new SemanticHandshakeValidator();
        const previousOutput = {
            user_id: "u123",
            data: {
                email: "invalid-email", // Invalid email format
                // Missing name field
            },
        };
        const stepContext = {
            stepName: "ProcessUserData",
            requiredInputSchema: {
                user_id: "string",
                data: {
                    email: "string",
                    name: "string",
                },
            },
            semanticExpectation: "The output must contain user identification and contact details.",
        };

        const result = await validator.validate(
            previousOutput,
            stepContext
        );

        expect(result).toBe(false);
    });

    it("should handle empty or null previous output gracefully", async () => {
        const validator = new SemanticHandshakeValidator();
        const previousOutput = null;
        const stepContext = {
            stepName: "ProcessUserData",
            requiredInputSchema: {
                user_id: "string",
                data: {
                    email: "string",
                    name: "string",
                },
            },
            semanticExpectation: "The output must contain user identification and contact details.",
        };

        const result = await validator.validate(
            previousOutput,
            stepContext
        );

        expect(result).toBe(false);
    });
});