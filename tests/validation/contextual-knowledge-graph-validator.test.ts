import { describe, it, expect } from "vitest";
import { GraphSchemaValidator } from "../src/validation/contextual-knowledge-graph-validator";
import { KnowledgeGraphSchema, GraphUpdatePayload } from "../src/validation/types";

describe("GraphSchemaValidator", () => {
    it("should validate a payload against a schema and report errors", () => {
        const mockSchema: KnowledgeGraphSchema = {
            nodeTypes: {
                Person: { requiredFields: ["name", "age"] },
                Location: { requiredFields: ["name", "coordinates"] },
            },
            edgeTypes: {
                KNOWS: { requiredFields: ["sourceType", "targetType"] },
            },
        };

        const validPayload: GraphUpdatePayload = {
            nodes: [
                { id: "p1", type: "Person", data: { name: "Alice", age: 30 } },
                { id: "l1", type: "Location", data: { name: "Paris", coordinates: "48.8566,2.3522" } },
            ],
            edges: [
                { id: "e1", source: "p1", target: "l1", type: "KNOWS", data: { sourceType: "Person", targetType: "Location" } },
            ],
        };

        const validator = new GraphSchemaValidator(mockSchema);
        const report = validator.validate(validPayload);

        expect(report.isValid).toBe(true);
        expect(report.errors).toEqual([]);
    });

    it("should detect missing required fields in nodes", () => {
        const mockSchema: KnowledgeGraphSchema = {
            nodeTypes: {
                Person: { requiredFields: ["name", "age"] },
            },
            edgeTypes: {},
        };

        const invalidPayload: GraphUpdatePayload = {
            nodes: [
                { id: "p1", type: "Person", data: { name: "Alice" } }, // Missing age
            ],
            edges: [],
        };

        const validator = new GraphSchemaValidator(mockSchema);
        const report = validator.validate(invalidPayload);

        expect(report.isValid).toBe(false);
        expect(report.errors).toContain("Node 'p1' of type 'Person' is missing required field: age");
    });

    it("should detect invalid edge types and missing required fields in edges", () => {
        const mockSchema: KnowledgeGraphSchema = {
            nodeTypes: {},
            edgeTypes: {
                KNOWS: { requiredFields: ["sourceType", "targetType"] },
            },
        };

        const invalidPayload: GraphUpdatePayload = {
            nodes: [],
            edges: [
                { id: "e1", source: "p1", target: "l1", type: "UNKNOWN", data: {} }, // Invalid edge type
                { id: "e2", source: "p2", target: "l2", type: "KNOWS", data: { sourceType: "Person" } }, // Missing targetType
            ],
        };

        const validator = new GraphSchemaValidator(mockSchema);
        const report = validator.validate(invalidPayload);

        expect(report.isValid).toBe(false);
        expect(report.errors).toContain("Edge 'e1' has an unknown type: UNKNOWN");
        expect(report.errors).toContain("Edge 'e2' of type 'KNOWS' is missing required field: targetType");
    });
});