import { DependencyGraph, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./dependency-graph-builder";

export class ToolCallDependencyGraphVisualizerAdvancedMermaid {
    private graph: DependencyGraph;

    constructor(graph: DependencyGraph) {
        this.graph = graph;
    }

    private mapNodeLabel(node: any): string {
        if (node.type === "user") {
            return `User Input: "${node.content.substring(0, 30)}..."`;
        }
        if (node.type === "assistant") {
            const toolUses = node.content.filter((block: ContentBlock) => block.type === "tool_use") as ToolUseBlock[];
            if (toolUses.length > 0) {
                const toolNames = toolUses.map(t => t.name).join(", ");
                return `Assistant Call: ${toolNames}`;
            }
            return `Assistant Response`;
        }
        if (node.type === "tool_result") {
            const result = node.content as ToolResultMessage;
            const status = result.is_error ? "ERROR" : "SUCCESS";
            return `Tool Result (${result.tool_use_id}): ${status}`;
        }
        return `Unknown Node`;
    }

    private mapEdgeLabel(source: any, target: any): string {
        if (source.type === "assistant" && target.type === "tool_result") {
            const toolUse = source.content.filter((block: ContentBlock) => block.type === "tool_use") as ToolUseBlock[];
            if (toolUse.length > 0) {
                const toolName = toolUse[0].name;
                return `Calls ${toolName}`;
            }
            return "Calls Tool";
        }
        if (source.type === "tool_result" && target.type === "assistant") {
            return "Continues Conversation";
        }
        return "Flow";
    }

    public generateMermaidGraph(graph: DependencyGraph): string {
        let mermaid = "graph TD;\n";

        const nodes: Map<string, string> = new Map();
        const nodeIds: string[] = [];

        // 1. Define Nodes
        graph.messages.forEach((message, index) => {
            const nodeId = `M${index}`;
            nodes.set(nodeId, this.mapNodeLabel(message));
            nodeIds.push(nodeId);
        });

        // 2. Define Edges (Dependencies)
        for (let i = 0; i < graph.messages.length - 1; i++) {
            const sourceId = `M${i}`;
            const targetId = `M${i + 1}`;
            const edgeLabel = this.mapEdgeLabel(graph.messages[i], graph.messages[i + 1]);
            mermaid += `    ${sourceId} -- "${edgeLabel}" --> ${targetId};\n`;
        }

        // 3. Define Node Shapes/Styles (Advanced Metadata)
        nodeIds.forEach(id => {
            const message = graph.messages[parseInt(id.substring(1))];
            let shape = "rectangle";
            let classDef = "";

            if (message.role === "user") {
                shape = "rounded";
                classDef = "classDef user fill:#e6f7ff,stroke:#007bff";
            } else if (message.role === "assistant") {
                shape = "rounded";
                classDef = "classDef assistant fill:#fff0b3,stroke:#ff9900";
            } else if (message.role === "tool") {
                shape = "hexagon";
                classDef = "classDef tool fill:#d4edda,stroke:#28a745";
            }

            mermaid += `    ${id}["${nodes.get(id)}"]:::${message.role}NodeStyle;\n`;
        });

        // 4. Add Styles and Legend
        mermaid += "\n%% Styles\n";
        mermaid += "classDef userNodeStyle fill:#e6f7ff,stroke:#007bff,stroke-width:2px;\n";
        mermaid += "classDef assistantNodeStyle fill:#fff0b3,stroke:#ff9900,stroke-width:2px;\n";
        mermaid += "classDef toolNodeStyle fill:#d4edda,stroke:#28a745,stroke-width:2px;\n";

        return mermaid.trim();
    }
}