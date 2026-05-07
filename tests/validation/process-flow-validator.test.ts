import { describe, it, expect } from "vitest";
import { ProcessFlowValidator } from "../src/validation/process-flow-validator.js";

describe("ProcessFlowValidator", () => {
    it("should validate a basic, valid process flow definition", () => {
        const validFlow = {
            startNodeId: "start",
            steps: {
                "start": {
                    type: "task",
                    inputs: ["input1"],
                    outputs: ["outputA"],
                    config: {},
                },
                "end": {
                    type: "end",
                    inputs: [],
                    outputs: [],
                    config: {},
                },
            },
            connections: {
                "start": [{
                    targetNodeId: "end",
                }],
            },
        };

        const validator = new ProcessFlowValidator();
        expect(validator.isValid(validFlow)).toBe(true);
    });

    it("should return false if a step definition is missing required fields (e.g., type)", () => {
        const invalidFlow = {
            startNodeId: "start",
            steps: {
                "start": {
                    // Missing 'type'
                    inputs: ["input1"],
                    outputs: ["outputA"],
                    config: {},
                },
            },
            connections: {},
        };

        const validator = new ProcessFlowValidator();
        expect(validator.isValid(invalidFlow)).toBe(false);
    });

    it("should return false if a connection targets a non-existent node", () => {
        const invalidFlow = {
            startNodeId: "start",
            steps: {
                "start": {
                    type: "task",
                    inputs: [],
                    outputs: [],
                    config: {},
                },
            },
            connections: {
                "start": [{
                    targetNodeId: "nonExistentNode",
                }],
            },
        };

        const validator = new ProcessFlowValidator();
        expect(validator.isValid(invalidFlow)).toBe(false);
    });
});