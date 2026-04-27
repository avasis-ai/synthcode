import { GraphNode, GraphEdge, ResourceConstraint } from "./graph-types";

export class ToolDependencyGraphVisualizerV7 {
    private nodes: GraphNode[];
    private edges: GraphEdge[];

    constructor(nodes: GraphNode[], edges: GraphEdge[]) {
        this.nodes = nodes;
        this.edges = edges;
    }

    private detectBottlenecks(edges: GraphEdge[]): { edge: GraphEdge; violation: string }[] {
        const bottlenecks: { edge: GraphEdge; violation: string }[] = [];
        for (const edge of edges) {
            for (const resource of edge.resourceRequirements) {
                if (resource.required > resource.capacity) {
                    bottlenecks.push({
                        edge: edge,
                        violation: `Resource ${resource.name} bottleneck: Required ${resource.required}, Capacity ${resource.capacity}`
                    });
                }
            }
        }
        return bottlenecks;
    }

    private processTemporalEdges(edges: GraphEdge[]): { processedEdges: GraphEdge[]; visualizationData: any[] } {
        const processedEdges: GraphEdge[] = [];
        const visualizationData: any[] = [];

        for (const edge of edges) {
            if (edge.startTime !== undefined && edge.endTime !== undefined) {
                const duration = edge.endTime - edge.startTime;
                processedEdges.push({ ...edge, temporal: true, duration: duration });
                visualizationData.push({
                    source: edge.sourceId,
                    target: edge.targetId,
                    start: edge.startTime,
                    end: edge.endTime,
                    resource: edge.resourceRequirements
                });
            } else {
                processedEdges.push(edge);
            }
        }
        return { processedEdges, visualizationData };
    }

    public visualize(containerId: string): void {
        const { processedEdges, visualizationData } = this.processTemporalEdges(this.edges);
        const bottlenecks = this.detectBottlenecks(this.edges);

        console.log("--- Dependency Graph Visualization V7 ---");
        console.log(`Nodes processed: ${this.nodes.length}`);
        console.log(`Edges processed: ${this.edges.length}`);

        if (bottlenecks.length > 0) {
            console.warn("\n[!!!] Resource Constraint Violations Detected (Bottlenecks):");
            bottlenecks.forEach(b => console.error(`  - ${b.violation} (Edge: ${b.edge.id})`));
        } else {
            console.log("\n[OK] No resource constraint violations detected.");
        }

        console.log("\n[Temporal Visualization Data Sample]:");
        if (visualizationData.length > 0) {
            console.log(JSON.stringify(visualizationData[0], null, 2));
        } else {
            console.log("No temporal edges found.");
        }

        this.renderGraph(containerId, processedEdges, bottlenecks);
    }

    private renderGraph(containerId: string, processedEdges: GraphEdge[], bottlenecks: { edge: GraphEdge; violation: string }[]): void {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element #${containerId} not found.`);
            return;
        }

        container.innerHTML = "<h2>Advanced Dependency Graph Visualization (V7)</h2>";

        // 1. Render Nodes (Simplified)
        const nodeContainer = document.createElement("div");
        nodeContainer.innerHTML = "<h3>Nodes</h3><p>Visualization of " + this.nodes.length + " nodes...</p>";
        container.appendChild(nodeContainer);

        // 2. Render Temporal Edges (Conceptual)
        const edgeContainer = document.createElement("div");
        edgeContainer.innerHTML = "<h3>Temporal & Resource Edges</h3>";

        processedEdges.forEach(edge => {
            const edgeElement = document.createElement("div");
            let content = `<strong>${edge.sourceId}</strong> -> <strong>${edge.targetId}</strong> (ID: ${edge.id})<br>`;

            if (edge.temporal) {
                content += `Time Span: ${edge.startTime} to ${edge.endTime} (${edge.duration} units)<br>`;
            } else {
                content += `Time Span: N/A`;
            }

            content += `Resources: ${edge.resourceRequirements.map(r => `${r.name}:${r.required}/${r.capacity}`).join(" | ")}`;
            edgeElement.innerHTML = content;
            edgeContainer.appendChild(edgeElement);
        });

        // 3. Render Bottleneck Overlay/Legend
        const legendContainer = document.createElement("div");
        legendContainer.innerHTML = "<h3>Constraint Legend</h3>";
        if (bottlenecks.length > 0) {
            const violationList = document.createElement("ul");
            bottlenecks.forEach(b => {
                const li = document.createElement("li");
                li.style.color = "red";
                li.textContent = `[!!] ${b.violation}`;
                violationList.appendChild(li);
            });
            legendContainer.appendChild(violationList);
        } else {
            const p = document.createElement("p");
            p.textContent = "No resource bottlenecks detected.";
            legendContainer.appendChild(p);
        }

        container.appendChild(edgeContainer);
        container.appendChild(legendContainer);
    }
}