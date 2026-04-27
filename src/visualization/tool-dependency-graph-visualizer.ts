import { GraphData, GraphNode, GraphEdge } from "../types";

export class ToolDependencyGraphVisualizer {
    private graphData: GraphData;
    private readonly containerElement: HTMLElement;

    constructor(containerElement: HTMLElement) {
        this.containerElement = containerElement;
        this.graphData = { nodes: [], edges: [] };
    }

    public initialize(graphData: GraphData): void {
        this.graphData = graphData;
        this.render();
    }

    public updateGraph(nodes: GraphNode[], edges: GraphEdge[]): void {
        this.graphData = { nodes, edges };
        this.render();
    }

    private render(): void {
        this.containerElement.innerHTML = "";
        const visualizationOutput = this.generateStandardizedRepresentation();

        const outputDiv = document.createElement("div");
        outputDiv.className = "tool-dependency-graph-visualizer-output";
        outputDiv.textContent = "Visualization Ready. Graph Data Structure:\n" + JSON.stringify(visualizationOutput, null, 2);

        this.containerElement.appendChild(outputDiv);
    }

    private generateStandardizedRepresentation(): Record<string, any> {
        const nodes: Record<string, GraphNode> = {};
        const edges: Record<string, GraphEdge> = {};

        this.graphData.nodes.forEach(node => {
            nodes[node.id] = node;
        });

        this.graphData.edges.forEach(edge => {
            edges[`${edge.source}-${edge.target}`] = edge;
        });

        return {
            metadata: {
                description: "Standardized representation of tool execution dependency graph.",
                nodeCount: this.graphData.nodes.length,
                edgeCount: this.graphData.edges.length,
            },
            nodes: Object.values(nodes),
            edges: Object.values(edges),
        };
    }
}