import { describe, it, expect } from "vitest";
import { FlowDefinitionBuilder } from "../src/flow/flow-definition-builder";

describe("FlowDefinitionBuilder", () => {
    it("should initialize correctly with an empty flow", () => {
        const builder = new FlowDefinitionBuilder();
        expect(builder.getFlowSteps()).toEqual([]);
    });

    it("should add a basic step with correct structure", () => {
        const builder = new FlowDefinitionBuilder();
        const step = {
            id: "step1",
            description: "Initial step",
            action: "wait",
            inputs: {},
            conditions: []
        };
        builder.addStep(step);
        const steps = builder.getFlowSteps();
        expect(steps.length).toBe(1);
        expect(steps[0]).toEqual(step);
    });

    it("should correctly update the last added step's description", () => {
        const builder = new FlowDefinitionBuilder();
        const initialStep = {
            id: "step1",
            description: "Old description",
            action: "wait",
            inputs: {},
            conditions: []
        };
        builder.addStep(initialStep);
        const updatedStep = {
            id: "step1",
            description: "New description",
            action: "wait",
            inputs: {},
            conditions: []
        };
        builder.updateStep(updatedStep);
        const steps = builder.getFlowSteps();
        expect(steps.length).toBe(1);
        expect(steps[0].description).toBe("New description");
    });
});