import { DependencyGraph } from "./dependency-graph";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV1 {
    private graph: DependencyGraph;

    constructor(graph: DependencyGraph) {
        this.graph = graph;
    }

    private generateNodeId(message: any): string {
        const role = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        const index = message.id || Math.random().toString(36).substring(2, 9);
        return `${role}-${index}`;
    }

    private generateMermaidNode(nodeId: string, message: any): string {
        let label = "";
        if (message.role === "user") {
            label = `User: "${message.content.substring(0, 20)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = (message.content as any[]).filter((block: any) => block.type === "tool_use");
            if (toolUses.length > 0) {
                label = `Assistant (Tools: ${toolUses.length})`;
            } else {
                label = `Assistant: "${message.content.substring(0, 20)}..."`;
            }
        } else if (message.role === "tool") {
            label = `Tool Result (${message.tool_use_id})`;
        }
        return `${nodeId}["${label}"]`;
    }

    private generateMermaidLink(sourceId: string, targetId: string): string {
        return `${sourceId} --> ${targetId}`;
    }

    public generateMermaidSyntax(): string {
        const nodes: { [key: string]: string } = {};
        const links: string[] = [];
        const messages = this.graph.getMessages();

        if (!messages || messages.length === 0) {
            return "graph TD\n    A[No messages found]";
        }

        messages.forEach((message, index) => {
            const nodeId = this.generateNodeId(message);
            nodes[nodeId] = this.generateMermaidNode(nodeId, message);
        });

        for (let i = 0; i < messages.length - 1; i++) {
            const sourceId = this.generateNodeId(messages[i]);
            const targetId = this.generateNodeId(messages[i + 1]);
            links.push(this.generateMermaidLink(sourceId, targetId));
        }

        let mermaid = "graph TD\n";
        mermaid += "%% Tool Call Dependency Graph (Simplified V1)\n";
        mermaid += nodes[Object.keys(nodes)[0]] || ""; // Ensure at least one node definition
        Object.keys(nodes).forEach(key => {
            if (key !== Object.keys(nodes)[0]) {
                mermaid += "\n" + nodes[key];
            }
        });

        mermaid += "\n";
        mermaid += links.join("\n");

        return mermaid;
    }

    public renderMermaid(): string {
        return this.generateMermaidSyntax();
    }
}