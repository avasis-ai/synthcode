import { DependencyGraph } from "./dependency-graph";
import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../types";

export class ToolCallDependencyGraphVisualizer {
    private graph: DependencyGraph;

    constructor(graph: DependencyGraph) {
        this.graph = graph;
    }

    private collectNodesAndEdges(): { nodes: Record<string, any>; edges: { from: string; to: string; label: string; type: string }[] } {
        const nodes: Record<string, any> = {};
        const edges: { from: string; to: string; label: string; type: string }[] = [];

        const processMessage = (message: Message, index: number) => {
            const nodeId = `msg_${index}`;
            nodes[nodeId] = {
                id: nodeId,
                type: message.role === "user" ? "User" : message.role === "assistant" ? "Assistant" : "ToolResult",
                content: message,
                metadata: {
                    index: index,
                }
            };

            if (message.role === "assistant" && message.content) {
                message.content.forEach((block, blockIndex) => {
                    if (block.type === "tool_use") {
                        const toolUseId = block.id;
                        const toolUseNodeId = `tool_use_${toolUseId}`;
                        nodes[toolUseNodeId] = {
                            id: toolUseNodeId,
                            type: "ToolUse",
                            toolUse: block as ToolUseBlock,
                            metadata: {
                                blockIndex: blockIndex,
                            }
                        };
                    }
                });
            }
        };

        const messages = this.graph.getMessages();
        messages.forEach((message, index) => {
            processMessage(message, index);

            if (message.role === "assistant" && message.content) {
                const toolUses: ToolUseBlock[] = (message.content as ContentBlock[]).filter(b => b.type === "tool_use") as ToolUseBlock[];
                toolUses.forEach((toolUse, blockIndex) => {
                    const toolUseNodeId = `tool_use_${toolUse.id}`;
                    // Edge from message to tool use block
                    edges.push({
                        from: `msg_${index}`,
                        to: toolUseNodeId,
                        label: `Uses Tool: ${toolUse.name}`,
                        type: "CALL"
                    });
                });
            }
        });

        // Add edges from tool use to hypothetical execution result (if we were simulating the full loop)
        // For visualization, we focus on the call structure: Message -> ToolUse
        
        return { nodes, edges };
    }

    /**
     * Generates a DOT language string representation of the tool call dependency graph.
     * @returns {string} The DOT graph definition string.
     */
    public toDotFormat(): string {
        const { nodes, edges } = this.collectNodesAndEdges();

        let dot = "digraph ToolCallDependencyGraph {\n";
        dot += "    rankdir=LR;\n";
        dot += "    node [shape=box, style=filled];\n\n";

        // Define nodes
        Object.values(nodes).forEach(node => {
            let shape = "box";
            let color = "lightgrey";
            let label = "";

            if (node.type === "User") {
                shape = "ellipse";
                color = "lightblue";
                label = `User Message (Index: ${node.metadata.index})\nContent: ${JSON.stringify(node.content.content.slice(0, 1)[0]?.text || 'N/A')}`;
            } else if (node.type === "Assistant") {
                shape = "rectangle";
                color = "lightgreen";
                label = `Assistant Message (Index: ${node.metadata.index})\nContent: ${JSON.stringify(node.content.content.slice(0, 1)[0]?.text || 'N/A')}`;
            } else if (node.type === "ToolUse") {
                shape = "octagon";
                color = "yellow";
                label = `Tool Call: ${node.toolUse.name}\nInput: ${JSON.stringify(node.toolUse.input)}`;
            }

            dot += `    ${node.id} [label="${label}", shape="${shape}", style="filled", fillcolor="${color}"];\n`;
        });

        dot += "\n";

        // Define edges
        edges.forEach(edge => {
            let edgeLabel = edge.label;
            let style = "dashed";
            if (edge.type === "CALL") {
                style = "solid";
            }
            dot += `    ${edge.from} -> ${edge.to} [label="${edgeLabel}", style="${style}"];\n`;
        });

        dot += "}\n";
        return dot;
    }
}