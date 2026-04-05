import { GraphContext, GraphNode, GraphEdge, Message } from "./graph-types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV116 {
    constructor() {}

    render(graph: GraphContext, context: { message: Message }): string {
        const nodes = graph.nodes;
        const edges = graph.edges;

        if (!nodes || nodes.length === 0) {
            return "graph TD; A[No nodes available]";
        }

        let mermaidGraph = "graph TD;\n";
        let nodeDefinitions: Map<string, string> = new Map();
        let edgeDefinitions: string[] = [];

        // 1. Define Nodes
        for (const node of nodes) {
            let content = "";
            let nodeId = `N${node.id}`;

            if (node.type === "user") {
                content = `User Input: "${node.content.substring(0, 50)}..."`;
            } else if (node.type === "assistant") {
                const toolUses = node.content.filter((block): block is ToolUseBlock => block.type === "tool_use");
                if (toolUses.length > 0) {
                    const toolNames = toolUses.map(t => t.name).join(", ");
                    content = `Assistant Response (Tools: ${toolNames})`;
                } else {
                    content = `Assistant Text: "${node.content.filter((block): block is TextBlock => block.type === "text")?.[0]?.text || ""}".substring(0, 50)}..."`;
                }
            } else if (node.type === "tool_result") {
                content = `Tool Result (${node.content.substring(0, 50)}...)\nError: ${node.content.includes("ERROR") ? "Yes" : "No"}`;
            } else {
                content = `Unknown Node Type`;
            }

            nodeDefinitions.set(nodeId, `${nodeId}["${content}"]`);
        }

        // 2. Define Edges (Focusing on flow and dependencies)
        for (const edge of edges) {
            let sourceId = `N${edge.source.id}`;
            let targetId = `N${edge.target.id}`;
            let label = "";

            if (edge.relationship === "CALLS") {
                label = "Calls";
            } else if (edge.relationship === "DEPENDS_ON") {
                label = "Depends On";
            } else if (edge.relationship === "FOLLOWS") {
                label = "Follows";
            }

            // Advanced conditional branching visualization:
            if (edge.relationship === "CONDITIONAL_BRANCH") {
                const condition = edge.context?.includes("if") ? " (If Condition Met)" : "";
                mermaidGraph += `    ${sourceId} -- "${label}${condition}" --> ${targetId};\n`;
                continue;
            }

            mermaidGraph += `    ${sourceId} -- "${label}" --> ${targetId};\n`;
        }

        // 3. Assemble final graph structure
        let finalMermaid = "";
        
        // Add all node definitions first
        nodeDefinitions.forEach((definition, id) => {
            finalMermaid += `    ${definition}\n`;
        });

        // Add all edge definitions
        finalMermaid += "\n";
        
        // Re-iterate edges to ensure proper Mermaid syntax structure
        for (const edge of edges) {
            let sourceId = `N${edge.source.id}`;
            let targetId = `N${edge.target.id}`;
            let label = "";

            if (edge.relationship === "CALLS") {
                label = "Calls";
            } else if (edge.relationship === "DEPENDS_ON") {
                label = "Depends On";
            } else if (edge.relationship === "FOLLOWS") {
                label = "Follows";
            }

            if (edge.relationship === "CONDITIONAL_BRANCH") {
                const condition = edge.context?.includes("if") ? " (If Condition Met)" : "";
                finalMermaid += `    ${sourceId} -- "${label}${condition}" --> ${targetId};\n`;
            } else {
                finalMermaid += `    ${sourceId} -- "${label}" --> ${targetId};\n`;
            }
        }

        return `graph TD\n${finalMermaid.trim()}`;
    }
}