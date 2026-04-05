import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV29 {
    private graphData: {
        nodes: string[];
        edges: { from: string; to: string; weight?: number };
    };

    private advancedOptions: {
        detectCycles: boolean;
        cycleStyle: string;
        customNodeStyles?: Record<string, string>;
    };

    constructor(graphData: {
        nodes: string[];
        edges: { from: string; to: string; weight?: number }[];
    }, advancedOptions: {
        detectCycles: boolean;
        cycleStyle: string;
        customNodeStyles?: Record<string, string>;
    }) {
        this.graphData = graphData;
        this.advancedOptions = advancedOptions;
    }

    private detectCycles(nodes: string[], edges: { from: string; to: string }[]): Set<string> {
        const visited: Set<string> = new Set();
        const recursionStack: Set<string> = new Set();
        const cycles: Set<string> = new Set();

        const dfs = (node: string, path: string[]): boolean => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            for (const edge of edges.filter(e => e.from === node)) {
                const neighbor = edge.to;
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor, path)) {
                        // Cycle detected further down, no need to re-add here,
                        // the cycle detection logic handles the reporting.
                    }
                } else if (recursionStack.has(neighbor)) {
                    // Cycle detected!
                    const cyclePath = path.slice(path.indexOf(neighbor));
                    const cycleString = cyclePath.join(" -> ") + " -> " + neighbor;
                    cycles.add(cycleString);
                }
            }

            recursionStack.delete(node);
            path.pop();
            return false;
        };

        for (const node of nodes) {
            if (!visited.has(node)) {
                dfs(node, []);
            }
        }
        return cycles;
    }

    public renderMermaidGraph(): string {
        let mermaidCode = "graph TD\n";

        // 1. Define Nodes with Custom Styles
        this.graphData.nodes.forEach(nodeId => {
            let style = this.advancedOptions.customNodeStyles?.[nodeId] || "";
            mermaidCode += `${nodeId}["${nodeId}"]${style}\n`;
        });

        // 2. Define Edges
        this.graphData.edges.forEach(edge => {
            let edgeDef = `${edge.from} --> ${edge.to}`;
            if (edge.weight !== undefined) {
                edgeDef += `{weight: ${edge.weight}}`;
            }
            mermaidCode += `${edgeDef}\n`;
        });

        // 3. Cycle Detection Visualization
        if (this.advancedOptions.detectCycles) {
            const cycleEdges = this.graphData.edges.filter(e => {
                // Simple check: if the edge is part of a known cycle, we might want to highlight it.
                // For simplicity here, we rely on the DFS cycle detection result to guide styling.
                return true;
            });

            const cycles = this.detectCycles(this.graphData.nodes, cycleEdges);

            if (cycles.size > 0) {
                mermaidCode += "\n%% Cycle Detection Visualization\n";
                cycles.forEach(cycleStr => {
                    // Mermaid doesn't easily allow styling a detected cycle path directly in the definition,
                    // so we use a subgraph or a specific note to highlight the issue.
                    mermaidCode += `subgraph Cycle: ${cycleStr.split(" -> ").join(" -> ")}\n`;
                    mermaidCode += `    style ${cycleStr.replace(/[^a-zA-Z0-9]/g, "")} fill:#f99,stroke:#333,stroke-width:2px\n`;
                    mermaidCode += `end\n`;
                });
            }
        }

        return mermaidCode;
    }
}