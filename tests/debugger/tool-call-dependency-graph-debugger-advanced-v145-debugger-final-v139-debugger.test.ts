import { describe, it, expect } from "vitest";
import {
    GraphState,
    GraphNode,
    GraphEdge,
    initializeGraphState,
    addNode,
    addEdge,
    getGraphState
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v145-debugger-final-v139-debugger";

describe("GraphState Management", () => {
    it("should initialize with an empty state", () => {
        const initialState = initializeGraphState();
        expect(initialState.nodes.size).toBe(0);
        expect(initialState.edges.size).toBe(0);
        expect(initialState.currentNodeId).toBeNull();
        expect(initialState.currentEdgeId).toBeNull();
    });

    it("should add a node correctly to the graph state", () => {
        const state = initializeGraphState();
        const newNode: GraphNode = {
            id: "node1",
            type: "user_input",
            data: {
                text: "Initial prompt"
            }
        };
        const newState = addNode(state, newNode);
        expect(newState.nodes.has("node1")).toBe(true);
        expect(newState.nodes.get("node1")).toEqual(newNode);
        expect(newState.edges.size).toBe(0);
    });

    it("should add an edge correctly and update the state", () => {
        const state = initializeGraphState();
        const nodeA: GraphNode = {
            id: "nodeA",
            type: "user_input",
            data: {}
        };
        const nodeB: GraphNode = {
            id: "nodeB",
            type: "tool_call",
            data: {}
        };
        let currentState = addNode(state, nodeA);
        currentState = addNode(currentState, nodeB);

        const newEdge: GraphEdge = {
            id: "edge1",
            sourceNodeId: "nodeA",
            targetNodeId: "nodeB",
            relationship: "calls"
        };
        const finalState = addEdge(currentState, newEdge);

        expect(finalState.edges.has("edge1")).toBe(true);
        expect(finalState.edges.get("edge1")).toEqual(newEdge);
        expect(finalState.nodes.size).toBe(2);
    });
});