import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV136 {
    private graphData: {
        source: string;
        target: string;
        weight?: number;
        label?: string;
    }[];

    private nodes: Record<string, {
        id: string;
        label: string;
        type: "user" | "assistant" | "tool";
        metadata: Record<string, unknown>;
    }>;

    constructor() {
        this.graphData = [];
        this.nodes = {};
    }

    public addDependency(sourceId: string, targetId: string, weight?: number, label?: string): void {
        this.graphData.push({ source: sourceId, target: targetId, weight, label });
    }

    public addNode(id: string, label: string, type: "user" | "assistant" | "tool", metadata: Record<string, unknown> = {}): void {
        this.nodes[id] = { id, label, type, metadata };
    }

    private generateMermaidGraphSyntax(): string {
        let mermaid = "graph TD\n";

        // 1. Define Nodes
        for (const nodeId in this.nodes) {
            const node = this.nodes[nodeId];
            let shape = "rounded";
            let classDef = "";

            switch (node.type) {
                case "user":
                    shape = "hexagon";
                    classDef = "classDef userStyle fill:#e6f7ff,stroke:#007bff,stroke-width:2px";
                    break;
                case "assistant":
                    shape = "stadium";
                    classDef = "classDef assistantStyle fill:#f0f9ff,stroke:#28a745,stroke-width:2px";
                    break;
                case "tool":
                    shape = "cylinder";
                    classDef = "classDef toolStyle fill:#fffbe6,stroke:#ffc107,stroke-width:2px";
                    break;
            }

            mermaid += `    ${nodeId}["${node.label}"]:::${node.type}Style\n`;
        }

        // 2. Define Edges
        for (const dependency of this.graphData) {
            let edge = `${dependency.source} --> ${dependency.target}`;
            let edgeLabel = dependency.label ? `\n    ${edge} -- "${dependency.label}" -->\n` : `${edge}\n`;

            if (dependency.weight !== undefined) {
                edgeLabel = `    ${edge} -- "Weight: ${dependency.weight}" -->\n`;
            } else {
                edgeLabel = `    ${edge}\n`;
            }
            mermaid += edgeLabel;
        }

        // 3. Apply Styles and Directives
        let styleDirectives = `\n%% Advanced Styling Directives\n`;
        styleDirectives += `classDef userStyle fill:#e6f7ff,stroke:#007bff,stroke-width:2px,rx:10px,ry:10px;\n`;
        styleDirectives += `classDef assistantStyle fill:#f0f9ff,stroke:#28a745,stroke-width:2px,rx:10px,ry:10px;\n`;
        styleDirectives += `classDef toolStyle fill:#fffbe6,stroke:#ffc107,stroke-width:2px,rx:10px,ry:10px;\n`;

        // Note: Mermaid handles basic styling via classDef, but for advanced layout, we rely on the graph structure.
        // We explicitly define the graph type for better rendering hints.
        styleDirectives += `\n%% Graph Type Hint\n`;
        styleDirectives += `%%{init: {'theme': 'neutral', 'flowchart': {'rankSpacing': 50, 'nodesGap': 30}}}\\n`;

        return mermaid + styleDirectives;
    }

    public generateMermaidString(): string {
        return this.generateMermaidGraphSyntax();
    }
}