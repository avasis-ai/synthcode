import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV19 {
    private messages: Message[];
    private config: {
        graphTitle: string;
        defaultStyle: string;
        mermaidVersion: "v19";
    };

    constructor(messages: Message[], config: { graphTitle: string; defaultStyle: string }) {
        this.messages = messages;
        this.config = {
            graphTitle: config.graphTitle,
            defaultStyle: config.defaultStyle,
            mermaidVersion: "v19"
        };
    }

    private getNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        return `${rolePrefix}${index}`;
    }

    private generateNodeContent(message: Message, nodeId: string): string {
        let content = "";
        if (message.role === "user") {
            content = `User Input: "${message.content.substring(0, 30)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = (message.content as ContentBlock[]).filter(block => block.type === "tool_use");
            if (toolUses.length > 0) {
                content = `Assistant Action: ${toolUses.length} tool call(s) initiated.`;
            } else {
                content = `Assistant Response: "${(message.content as ContentBlock[])[0]?.text?.text || 'No text content.'].substring(0, 30)}..."`;
            }
        } else if (message.role === "tool") {
            content = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        }
        return content;
    }

    private buildMermaidGraph(): string {
        let graph = `graph TD;\n`;
        graph += `%% Mermaid Version: ${this.config.mermaidVersion}\n`;
        graph += `%% Title: ${this.config.graphTitle}\n`;
        graph += `%% Styling Directives for V19\n`;
        graph += `classDef user fill:#e6f7ff,stroke:#007bff,stroke-width:2px;`;
        graph += `classDef assistant fill:#fff0e6,stroke:#ff9900,stroke-width:2px;`;
        graph += `classDef tool fill:#e6ffe6,stroke:#28a745,stroke-width:2px;`;
        graph += `classDef default ${this.config.defaultStyle};\n\n`;

        const nodes: { id: string, content: string }[] = [];
        const connections: { from: string, to: string, label: string }[] = [];

        this.messages.forEach((message, index) => {
            const nodeId = this.getNodeId(message, index);
            const content = this.generateNodeContent(message, nodeId);
            nodes.push({ id: nodeId, content: content });

            if (index > 0) {
                const prevMessage = this.messages[index - 1];
                let label = "->";
                if (message.role === "tool" && prevMessage.role === "assistant") {
                    label = "Tool Result";
                } else if (message.role === "assistant" && prevMessage.role === "user") {
                    label = "Response";
                }
                connections.push({ from: this.getNodeId(prevMessage, index - 1), to: nodeId, label: label });
            }
        });

        // Define Nodes
        nodes.forEach(({ id, content }) => {
            graph += `${id}["${content}"]\n`;
        });

        // Define Edges
        connections.forEach(({ from, to, label }) => {
            graph += `${from} -->|${label}| ${to};\n`;
        });

        // Apply Classes
        const classMap: Record<string, string> = {
            "U0": "user",
            "A": "assistant",
            "T": "tool"
        };

        nodes.forEach((node, index) => {
            const message = this.messages[index];
            const roleClass = message.role === "user" ? "user" : message.role === "assistant" ? "assistant" : "tool";
            graph += `class ${node.id} ${roleClass};\n`;
        });

        return graph;
    }

    /**
     * Renders the dependency graph using Mermaid syntax for v19 features.
     * @returns The complete Mermaid graph definition string.
     */
    public renderGraph(): string {
        return this.buildMermaidGraph();
    }
}