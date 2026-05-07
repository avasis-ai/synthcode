import { describe, it, expect } from "vitest"
import { ConflictDependencyGraphBuilder } from "../../../src/dependency/conflict-dependency-graph-builder"

describe("ConflictDependencyGraphBuilder", () => {
    it("should build a graph with only dependencies when no conflicts exist", () => {
        const builder = new ConflictDependencyGraphBuilder([
            { id: "A", name: "Step A", startTime: 0, endTime: 10, resources: { "CPU": 1 }, capabilities: ["cap1"] },
            { id: "B", name: "Step B", startTime: 5, endTime: 15, resources: { "CPU": 1 }, capabilities: ["cap2"] },
        ], [
            { sourceId: "A", targetId: "B", type: "dependency" }
        ])
        const graph = builder.buildGraph()

        expect(graph.nodes.length).toBe(2)
        expect(graph.edges.length).toBe(1)
        expect(graph.conflictReport).toEqual([])
        expect(graph.edges[0].type).toBe("dependency")
    })

    it("should detect and report a resource conflict between two steps", () => {
        const builder = new ConflictDependencyGraphBuilder([
            { id: "A", name: "Step A", startTime: 0, endTime: 10, resources: { "CPU": 1 }, capabilities: ["cap1"] },
            { id: "B", name: "Step B", startTime: 5, endTime: 15, resources: { "CPU": 1 }, capabilities: ["cap2"] },
        ], [
            { sourceId: "A", targetId: "B", type: "dependency" }
        ])
        const graph = builder.buildGraph()

        expect(graph.nodes.length).toBe(2)
        expect(graph.edges.length).toBe(1)
        expect(graph.conflictReport.length).toBeGreaterThan(0)
        expect(graph.conflictReport[0]).toContain("resource conflict")
    })

    it("should handle multiple conflicts and dependencies correctly", () => {
        const builder = new ConflictDependencyGraphBuilder([
            { id: "A", name: "Step A", startTime: 0, endTime: 10, resources: { "CPU": 1 }, capabilities: ["cap1"] },
            { id: "B", name: "Step B", startTime: 5, endTime: 15, resources: { "CPU": 1 }, capabilities: ["cap2"] },
            { id: "C", name: "Step C", startTime: 12, endTime: 20, resources: { "GPU": 1 }, capabilities: ["cap3"] },
        ], [
            { sourceId: "A", targetId: "B", type: "dependency" },
            { sourceId: "A", targetId: "C", type: "dependency" }
        ])
        const graph = builder.buildGraph()

        expect(graph.nodes.length).toBe(3)
        expect(graph.edges.length).toBe(2)
        expect(graph.conflictReport.length).toBeGreaterThan(0)
        expect(graph.conflictReport[0]).toContain("resource conflict")
    })
})