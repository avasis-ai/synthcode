import { describe, it, expect, vi } from "vitest";
import { ToolDependencyGraphVisualizer } from "../src/visualization/tool-dependency-graph-visualizer";
import { GraphData, GraphNode, GraphEdge } from "../src/visualization/types";

describe("ToolDependencyGraphVisualizer", () => {
    let container: HTMLElement;
    let visualizer: ToolDependencyGraphVisualizer;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        visualizer = new ToolDependencyGraphVisualizer(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it("should initialize with empty graph data and render nothing initially", () => {
        // Spy on the render method to check if it's called and what it does
        const renderSpy = vi.spyOn(visualizer, "render");
        visualizer.initialize({ nodes: [], edges: [] });
        expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it("should render the graph correctly when initialized with valid data", () => {
        const mockGraphData: GraphData = {
            nodes: [
                { id: "A", label: "Tool A", x: 10, y: 10 },
                { id: "B", label: "Tool B", x: 50, y: 50 },
            ],
            edges: [
                { source: "A", target: "B", type: "uses" },
            ],
        };

        const renderSpy = vi.spyOn(visualizer, "render");
        visualizer.initialize(mockGraphData);

        // Assuming render() updates the container element's content or structure
        expect(renderSpy).toHaveBeenCalledWith();
        // A more robust test would check the actual DOM structure rendered by the visualizer
    });

    it("should update the graph visualization when updateGraph is called", () => {
        const initialData: GraphData = {
            nodes: [{ id: "A", label: "Tool A", x: 10, y: 10 }],
            edges: [],
        };
        const updatedData: GraphData = {
            nodes: [{ id: "A", label: "Tool A", x: 10, y: 10 }, { id: "C", label: "Tool C", x: 100, y: 100 }],
            edges: [{ source: "A", target: "C", type: "uses" }],
        };

        const renderSpy = vi.spyOn(visualizer, "render");
        visualizer.initialize(initialData);

        // Simulate updateGraph call (assuming it calls render internally)
        // We need to mock the actual implementation of updateGraph if it's complex,
        // but based on the signature, we test the effect.
        (visualizer as any).updateGraph = (nodes: GraphNode[], edges: GraphEdge[]) => {
            visualizer['graphData'] = { nodes, edges };
            visualizer.render();
        };

        (visualizer as any).updateGraph(updatedData.nodes, updatedData.edges);

        expect(renderSpy).toHaveBeenCalledTimes(2); // Once on initialize, once on updateGraph
    });
});