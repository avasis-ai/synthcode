import { describe, it, expect } from "vitest";
import { CompatibilityMatrixGenerator } from "../src/compatibility/compatibility-matrix-generator.js";

describe("CompatibilityMatrixGenerator", () => {
    it("should generate a compatibility matrix for a set of components", () => {
        const componentA = {
            name: "ComponentA",
            version: "1.0.0",
            schema: (input) => input.hasOwnProperty("keyA"),
            resourceRequirements: "ResourceA",
            sideEffects: "SideEffectA",
        };
        const componentB = {
            name: "ComponentB",
            version: "2.0.0",
            schema: (input) => input.hasOwnProperty("keyB"),
            resourceRequirements: "ResourceB",
            sideEffects: "SideEffectB",
        };

        const generator = new CompatibilityMatrixGenerator();
        const matrix = generator.generateMatrix([componentA, componentB]);

        expect(matrix).toBeDefined();
        expect(Object.keys(matrix)).toHaveLength(2);
        expect(Object.keys(matrix["ComponentA"])).toHaveLength(2);
        expect(matrix["ComponentA"]["ComponentB"]).toBeDefined();
    });

    it("should correctly calculate compatibility score for compatible components", () => {
        const componentA = {
            name: "ComponentA",
            version: "1.0.0",
            schema: (input) => true,
            resourceRequirements: "ResourceA",
            sideEffects: "SideEffectA",
        };
        const componentB = {
            name: "ComponentB",
            version: "2.0.0",
            schema: (input) => true,
            resourceRequirements: "ResourceB",
            sideEffects: "SideEffectB",
        };

        const generator = new CompatibilityMatrixGenerator();
        const matrix = generator.generateMatrix([componentA, componentB]);

        // Assuming perfect compatibility for simple case
        expect(matrix["ComponentA"]["ComponentB"].isCompatible).toBe(true);
        expect(matrix["ComponentA"]["ComponentB"].score).toBeGreaterThanOrEqual(0);
    });

    it("should handle components with conflicting resource requirements", () => {
        const componentA = {
            name: "ComponentA",
            version: "1.0.0",
            schema: (input) => true,
            resourceRequirements: "ResourceX",
            sideEffects: "SideEffectA",
        };
        const componentB = {
            name: "ComponentB",
            version: "2.0.0",
            schema: (input) => true,
            resourceRequirements: "ResourceX", // Conflict
            sideEffects: "SideEffectB",
        };

        const generator = new CompatibilityMatrixGenerator();
        const matrix = generator.generateMatrix([componentA, componentB]);

        // Expecting incompatibility due to shared resource
        expect(matrix["ComponentA"]["ComponentB"].isCompatible).toBe(false);
        expect(matrix["ComponentA"]["ComponentB"].conflicts).toContain("ResourceX");
    });
});