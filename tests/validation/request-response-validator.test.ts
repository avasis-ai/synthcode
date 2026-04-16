import { describe, it, expect } from "vitest";
import { RequestResponseValidator } from "../src/validation/request-response-validator";
import { z } from "zod";

describe("RequestResponseValidator", () => {
    it("should return isValid: true and correct data for valid input", () => {
        const schema = z.object({
            id: z.number(),
            name: z.string(),
        });
        const validator = new RequestResponseValidator(schema);
        const validData = { id: 123, name: "Test User" };
        const result = validator.validate(validData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.data).toEqual({ id: 123, name: "Test User" } as any);
    });

    it("should return isValid: false and appropriate errors for invalid input", () => {
        const schema = z.object({
            id: z.number(),
            name: z.string().min(3),
        });
        const validator = new RequestResponseValidator(schema);
        const invalidData = { id: "abc", name: "ab" };
        const result = validator.validate(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.data).toBeNull();
    });

    it("should handle null or undefined input gracefully", () => {
        const schema = z.object({
            requiredField: z.string(),
        });
        const validator = new RequestResponseValidator(schema);

        let result = validator.validate(null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);

        result = validator.validate(undefined);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
    });
});