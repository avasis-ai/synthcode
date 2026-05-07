import { describe, it, expect } from "vitest"
import { GraphPathfinder, Graph, NodeId } from "../src/graph/pathfinder"

describe("GraphPathfinder", () => {
  it("should find the shortest path in an unweighted graph using BFS", () => {
    const graph: Graph = new Map([
      ["A", [{ target: "B", weight: 1 }, { target: "C", weight: 1 }]],
      ["B", [{ target: "D", weight: 1 }]],
      ["C", [{ target: "E", weight: 1 }]],
      ["D", [{ target: "F", weight: 1 }]],
      ["E", [{ target: "F", weight: 1 }]],
      ["F", []],
    ])
    const pathfinder = new GraphPathfinder(graph)
    const path = pathfinder.findPath("A", "F")
    expect(path).toEqual(["A", "B", "D", "F"]) // Assuming BFS finds one valid shortest path
  })

  it("should handle no path existing between two nodes", () => {
    const graph: Graph = new Map([
      ["A", [{ target: "B", weight: 1 }]],
      ["B", []],
      ["C", [{ target: "D", weight: 1 }]],
      ["D", []],
    ])
    const pathfinder = new GraphPathfinder(graph)
    const path = pathfinder.findPath("A", "D")
    expect(path).toBeNull()
  })

  it("should return the start node if start and end nodes are the same", () => {
    const graph: Graph = new Map([
      ["A", [{ target: "B", weight: 1 }]],
      ["B", []],
    ])
    const pathfinder = new GraphPathfinder(graph)
    const path = pathfinder.findPath("A", "A")
    expect(path).toEqual(["A"])
  })
})