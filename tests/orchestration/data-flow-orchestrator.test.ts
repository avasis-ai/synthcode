import { describe, it, expect, vi } from "vitest";
import { DataFlowOrchestrator } from "../src/orchestration/data-flow-orchestrator.js";

describe("DataFlowOrchestrator", () => {
  it("should successfully execute a simple linear data flow", async () => {
    const mockMessage = { payload: "initial data" };
    const nodeA: Node = {
      id: "A",
      source: mockMessage,
      execute: async (state) => ({ resultA: "A processed", state: state }),
      initialState: "PENDING",
    };
    const nodeB: Node = {
      id: "B",
      source: { payload: "data from A" },
      execute: async (state) => ({ resultB: "B processed", state: state }),
      initialState: "PENDING",
    };

    const edge: Edge = { from: "A", to: "B", transform: (input) => ({ processed: input.resultA }));

    const graph: DataFlowGraph = {
      nodes: new Map([["A", nodeA], ["B", nodeB]]),
      edges: [edge],
    };

    const orchestrator = new DataFlowOrchestrator(graph);
    const result = await orchestrator.run();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("resultB");
    expect(result.resultB).toContain("B processed");
  });

  it("should handle node failures and stop execution", async () => {
    const mockMessage = { payload: "initial data" };
    const nodeA: Node = {
      id: "A",
      source: mockMessage,
      execute: async (state) => {
        if (state["B"] === "FAILED") {
          throw new Error("Simulated failure");
        }
        return { resultA: "A processed" };
      },
      initialState: "PENDING",
    };
    const nodeB: Node = {
      id: "B",
      source: { payload: "data from A" },
      execute: async (state) => {
        // This node will fail if A fails, but we test A failing first.
        return { resultB: "B processed" };
      },
      initialState: "PENDING",
    };

    const edge: Edge = { from: "A", to: "B", transform: (input) => ({ processed: input.resultA }));

    const graph: DataFlowGraph = {
      nodes: new Map([["A", nodeA], ["B", nodeB]]),
      edges: [edge],
    };

    const orchestrator = new DataFlowOrchestrator(graph);
    // Manually set state for B to simulate failure dependency
    const failingGraph = {
      nodes: new Map([["A", nodeA], ["B", nodeB]]),
      edges: [edge],
    };
    const failingOrchestrator = new DataFlowOrchestrator(failingGraph);

    // To test failure propagation, we need to simulate the state change that causes failure
    // Since the orchestrator handles state, we rely on the internal logic.
    // We will mock the execution to force a failure on A.
    const mockNodeA = {
      id: "A",
      source: mockMessage,
      execute: async () => {
        throw new Error("Simulated failure in A");
      },
      initialState: "PENDING",
    };
    const mockGraph: DataFlowGraph = {
      nodes: new Map([["A", mockNodeA], ["B", nodeB]]),
      edges: [edge],
    };
    const failingOrchestrator2 = new DataFlowOrchestrator(mockGraph);

    await expect(failingOrchestrator2.run()).rejects.toThrow("Simulated failure in A");
  });

  it("should correctly transform data across edges", async () => {
    const mockMessage = { payload: "initial data" };
    const nodeA: Node = {
      id: "A",
      source: mockMessage,
      execute: async (state) => ({ resultA: "A processed", value: 10 }),
      initialState: "PENDING",
    };
    const nodeB: Node = {
      id: "B",
      source: { payload: "data from A" },
      execute: async (state) => ({ resultB: "B processed", finalValue: 20 }),
      initialState: "PENDING",
    };

    // Transformation: takes resultA and multiplies it by 2
    const edge: Edge = { from: "A", to: "B", transform: (input) => input.resultA * 2 };

    const graph: DataFlowGraph = {
      nodes: new Map([["A", nodeA], ["B", nodeB]]),
      edges: [edge],
    };

    const orchestrator = new DataFlowOrchestrator(graph);
    const result = await orchestrator.run();

    expect(result).toBeDefined();
    // The transformation happens before B executes, and the result is passed to B's state.
    // We check if the transformed value is correctly incorporated.
    expect(result).toHaveProperty("resultB");
    // Assuming the transformation result is available in the state passed to B, 
    // and B's execution uses it (or the state structure reflects it).
    // Since B's execute function doesn't explicitly use the transformed value in its return, 
    // we verify the state structure implies the transformation occurred.
    // For simplicity, we check if the state passed to B reflects the transformation.
    expect(result).toHaveProperty("state");
    expect(result.state).toHaveProperty("A_to_B_transformed");
    expect(result.state.A_to_B_transformed).toBe(20);
  });
});