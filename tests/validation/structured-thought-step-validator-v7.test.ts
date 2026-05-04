import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV7 } from "../src/validation/structured-thought-step-validator-v7";
import { Message } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV7", () => {
    it("should validate a sequence with correct temporal order and causal link", () => {
        const mockTemporalOrder = jest.fn(() => true);
        const mockCausalLink = jest.fn(() => true);
        const validator = new StructuredThoughtStepValidatorV7(mockTemporalOrder, mockCausalLink);

        const message1: Message = { id: "m1", content: { type: "text", value: "Start" } };
        const message2: Message = { id: "m2", content: { type: "text", value: "Continue" } };

        const isValid = validator.isValid(message2, message1);
        expect(isValid).toBe(true);
        expect(mockTemporalOrder).toHaveBeenCalledWith(message2, message1);
        expect(mockCausalLink).toHaveBeenCalledWith(message2, message1);
    });

    it("should return false if temporal order is violated", () => {
        const mockTemporalOrder = jest.fn(() => false);
        const mockCausalLink = jest.fn(() => true);
        const validator = new StructuredThoughtStepValidatorV7(mockTemporalOrder, mockCausalLink);

        const message1: Message = { id: "m1", content: { type: "text", value: "Start" } };
        const message2: Message = { id: "m2", content: { type: "text", value: "Invalid Order" } };

        const isValid = validator.isValid(message2, message1);
        expect(isValid).toBe(false);
        expect(mockTemporalOrder).toHaveBeenCalledTimes(1);
        expect(mockCausalLink).not.toHaveBeenCalled();
    });

    it("should return false if causal link is missing", () => {
        const mockTemporalOrder = jest.fn(() => true);
        const mockCausalLink = jest.fn(() => false);
        const validator = new StructuredThoughtStepValidatorV7(mockTemporalOrder, mockCausalLink);

        const message1: Message = { id: "m1", content: { type: "text", value: "Start" } };
        const message2: Message = { id: "m2", content: { type: "text", value: "No Link" } };

        const isValid = validator.isValid(message2, message1);
        expect(isValid).toBe(false);
        expect(mockTemporalOrder).toHaveBeenCalledTimes(1);
        expect(mockCausalLink).toHaveBeenCalledTimes(1);
    });
});