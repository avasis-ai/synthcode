import { describe, it, expect } from "vitest";
import { ServiceDependencyGraphBuilder, ServiceNode, ServiceEdge } from "../../../src/dependency/service-dependency-graph-builder";

describe("ServiceDependencyGraphBuilder", () => {
  it("should correctly build a graph from provided nodes and edges", () => {
    const builder = new ServiceDependencyGraphBuilder();

    const nodes: ServiceNode[] = [
      { name: "AuthService", description: "Handles authentication", endpoint: "/auth" },
      { name: "UserService", description: "Manages user profiles", endpoint: "/users" },
      { name: "PaymentService", description: "Processes payments", endpoint: "/payments" },
    ];

    const edges: ServiceEdge[] = [
      { source: "AuthService", target: "UserService", type: "requires", description: "User needs auth token" },
      { source: "UserService", target: "PaymentService", type: "optional", description: "Payment might need user data" },
      { source: "PaymentService", target: "AuthService", type: "fails_over_to", description: "Payment fails over to auth" },
    ];

    // Assuming a method exists to build the graph, e.g., buildGraph
    // Since the full class implementation is not provided, we simulate the usage based on the constructor and structure.
    // We assume the builder has a method like build(nodes, edges) or similar setup.
    // For this test, we assume the builder is initialized and then populated/built.
    (builder as any).buildGraph(nodes, edges);

    // Check if the internal state (nodes and edges) is populated correctly
    expect((builder as any).getNodes()).toEqual(
      expect.objectContaining({
        "AuthService": { name: "AuthService", description: "Handles authentication", endpoint: "/auth" },
        "UserService": { name: "UserService", description: "Manages user profiles", endpoint: "/users" },
        "PaymentService": { name: "PaymentService", description: "Processes payments", endpoint: "/payments" },
      })
    );

    expect((builder as any).getEdges()).toHaveLength(3);
    expect((builder as any).getEdges()).toEqual(
      expect.arrayContaining([
        { source: "AuthService", target: "UserService", type: "requires", description: "User needs auth token" },
        { source: "UserService", target: "PaymentService", type: "optional", description: "Payment might need user data" },
        { source: "PaymentService", target: "AuthService", type: "fails_over_to", description: "Payment fails over to auth" },
      ])
    );
  });

  it("should handle empty inputs gracefully", () => {
    const builder = new ServiceDependencyGraphBuilder();
    const emptyNodes: ServiceNode[] = [];
    const emptyEdges: ServiceEdge[] = [];

    (builder as any).buildGraph(emptyNodes, emptyEdges);

    expect((builder as any).getNodes()).toEqual({});
    expect((builder as any).getEdges()).toHaveLength(0);
  });

  it("should ignore edges with undefined or unknown source/target services", () => {
    const builder = new ServiceDependencyGraphBuilder();

    const nodes: ServiceNode[] = [
      { name: "ServiceA", description: "A", endpoint: "/a" },
    ];

    const edges: ServiceEdge[] = [
      { source: "ServiceA", target: "ServiceB", type: "requires", description: "Valid edge" }, // ServiceB doesn't exist
      { source: "UnknownService", target: "ServiceA", type: "optional", description: "Unknown source" },
      { source: "ServiceA", target: "ServiceA", type: "requires", description: "Self-loop" }, // Valid self-loop
    ];

    // We expect only valid edges (those whose source and target are defined in the nodes)
    (builder as any).buildGraph(nodes, edges);

    // Only the self-loop should be included if the builder validates against provided nodes
    expect((builder as any).getEdges()).toHaveLength(1);
    expect((builder as any).getEdges()[0].source).toBe("ServiceA");
    expect((builder as any).getEdges()[0].target).toBe("ServiceA");
  });
});