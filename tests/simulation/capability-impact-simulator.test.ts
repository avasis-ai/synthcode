import { describe, it, expect } from "vitest";
import { CapabilityImpactSimulator } from "../src/simulation/capability-impact-simulator.js";
import { Graph, Node, Edge } from "../src/simulation/graph-types.js";

describe("CapabilityImpactSimulator", () => {
    it("should initialize correctly with provided graphs", () => {
        const mockGraph: Graph<Node, Edge> = {
            nodes: new Map(),
            edges: new Map(),
        };
        const simulator = new CapabilityImpactSimulator(mockGraph, mockGraph);
        expect(simulator).toBeInstanceOf(CapabilityImpactSimulator);
    });

    it("should generate a basic impact report for a non-conflicting capability", () => {
        const mockGraph: Graph<Node, Edge> = {
            nodes: new Map([
                ["A", { id: "A", label: "Node A" }],
                ["B", { id: "B", label: "Node B" }],
            ]),
            edges: new Map([
                ["A-B", { source: "A", target: "B", weight: 1 }],
            ]),
        };
        const simulator = new CapabilityImpactSimulator(mockGraph, mockGraph);

        const capabilityPayload = {
            id: "C1",
            type: "tool",
            definition: { requires: ["A"], affects: ["B"] },
        };

        const report = simulator.simulateImpact(capabilityPayload);

        expect(report.conflicts).toEqual([]);
        expect(report.prerequisites).toEqual(["A"]);
        expect(report.affectedNodes.has("A")).toBe(true);
        expect(report.affectedNodes.has("B")).toBe(true);
        expect(report.affectedEdges.size).toBeGreaterThanOrEqual(0);
    });

    it("should detect conflicts and prerequisites for a complex capability", () => {
        const mockGraph: Graph<Node, Edge> = {
            nodes: new Map([
                ["N1", { id: "N1", label: "Node 1" }],
                ["N2", { id: "N2", label: "Node 2" }],
                ["N3", { id: "N3", label: "Node 3" }],
            ]),
            edges: new Map([
                ["E1", { source: "N1", target: "N2", weight: 1 }],
                ["E2", { source: "N2", target: "N3", weight: 1 }],
            ]),
        };
        const simulator = new CapabilityImpactSimulator(mockGraph, mockGraph);

        const capabilityPayload = {
            id: "C_Conflict",
            type: "constraint",
            definition: {
                requires: ["N1"],
                conflictsWith: ["N3"],
                affects: ["N2"],
            },
        };

        const report = simulator.simulateImpact(capabilityPayload);

        expect(report.conflicts).toEqual(["N3"]);
        expect(report.prerequisites).toEqual(["N1"]);
        expect(report.affectedNodes.has("N1")).toBe(true);
        expect(report.affectedNodes.has("N2")).toBe(true);
        expect(report.affectedNodes.has("N3")).toBe(false); // Should not affect N3 if it's only a conflict
    });
});