import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizer {
    private graphBuilder: string = "";

    constructor() {}

    private generateNodeId(message: Message, index: number): string {
        const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        const contentHash = btoa(message.content ? JSON.stringify(message.content) : "").substring(0, 8);
        return `${prefix}_${contentHash}_${index}`;
    }

    private buildNode(nodeId: string, title: string, content: string): string {
        return `    ${nodeId}["${title}\\n${content.replace(/\n/g, "\\n")}"]`;
    }

    private buildEdge(fromId: string, toId: string, label: string = ""): string {
        return `    ${fromId} -->|${label}| ${toId};`;
    }

    private buildConditionalMerge(nodeId: string, incomingEdges: string[]): string {
        let edges = "";
        for (const edge of incomingEdges) {
            edges += `    ${edge.from} -->|${edge.label}| ${nodeId};`;
        }
        return `\n${edges}`;
    }

    public buildGraph(messages: Message[], toolCalls: { fromIndex: number; toIndex: number; label: string }[]): string {
        let mermaidCode: string[] = [];
        let nodeIdMap: Map<number, string> = new Map();
        let nodeDefinitions: string[] = [];
        let edges: string[] = [];
        let currentToolCallEdges: string[] = [];

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const nodeId = this.generateNodeId(message, i);
            nodeIdMap.set(i, nodeId);

            let contentSummary = "";
            let title = "";

            if (message.role === "user") {
                contentSummary = message.content ? JSON.stringify(message.content) : "";
                title = "User Input";
            } else if (message.role === "assistant") {
                const blocks = message.content as ContentBlock[];
                let blockDetails = blocks.map(block => {
                    if (block.type === "text") return `Text: ${block.text.substring(0, 30)}...`;
                    if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
                    if (block.type === "thinking") return `Thinking: ${block.thinking.substring(0, 30)}...`;
                    return "";
                }).join("\n");
                contentSummary = blockDetails;
                title = "Assistant Response";
            } else if (message.role === "tool") {
                contentSummary = `Tool Result for ${message.tool_use_id}: ${message.content.substring(0, 30)}...`;
                title = "Tool Result";
            }

            const nodeContent = `Role: ${message.role}\\n${contentSummary}`;
            nodeDefinitions.push(this.buildNode(nodeId, title, nodeContent));
        }

        // 1. Build standard sequential edges
        for (let i = 0; i < messages.length - 1; i++) {
            const fromId = nodeIdMap.get(i)!;
            const toId = nodeIdMap.get(i + 1)!;
            edges.push(this.buildEdge(fromId, toId, "Sequential Flow"));
        }

        // 2. Build explicit tool call dependency edges
        for (const tc of toolCalls) {
            const fromId = nodeIdMap.get(tc.fromIndex)!;
            const toId = nodeIdMap.get(tc.toIndex)!;
            edges.push(this.buildEdge(fromId, toId, tc.label));
        }

        // 3. Handle advanced flow control (Placeholder for future complex logic)
        // For this advanced version, we assume toolCalls already capture the necessary flow.
        // If we needed a specific 'conditional_merge' node, we would calculate its ID and use buildConditionalMerge.

        let graphDefinition = "graph TD";
        graphDefinition += "\n";
        graphDefinition += "%% Nodes Definition\n";
        graphDefinition += nodeDefinitions.join("\n");

        graphDefinition += "\n%% Edges Definition\n";
        graphDefinition += edges.join("\n");

        return `mermaid\n${graphDefinition}`;
    }
}