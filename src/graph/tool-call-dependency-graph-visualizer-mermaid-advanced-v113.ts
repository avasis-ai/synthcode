import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV113 {
    private readonly graphOptions: Record<string, any>;

    constructor(options: Record<string, any> = {}) {
        this.graphOptions = {
            direction: "LR",
            theme: "neutral",
            ...options
        };
    }

    private mapMessageToNodes(messages: Message[]): string[] {
        const nodeIds: string[] = [];
        let counter = 1;

        for (const message of messages) {
            if (message.role === "user") {
                const nodeId = `user_${counter++}`;
                nodeIds.push(nodeId);
            } else if (message.role === "assistant") {
                const nodeId = `assistant_${counter++}`;
                nodeIds.push(nodeId);
            } else if (message.role === "tool") {
                const nodeId = `tool_${message.tool_use_id}`;
                nodeIds.push(nodeId);
            }
        }
        return nodeIds;
    }

    private generateMermaidGraph(messages: Message[]): string {
        const graphTitle = "Tool Call Dependency Graph";
        let mermaidCode = `graph ${this.graphOptions.direction} ${graphTitle}\n`;

        const nodeIds = this.mapMessageToNodes(messages);
        const nodeMap: Map<string, string> = new Map();

        // 1. Define Nodes
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            let nodeId: string;
            let label: string;
            let style: string = "";

            if (message.role === "user") {
                nodeId = `user_${i + 1}`;
                label = `User Input (${i + 1})`;
                style = "fill:#e6f7ff,stroke:#91d5ff";
            } else if (message.role === "assistant") {
                nodeId = `assistant_${i + 1}`;
                label = `Assistant Response (${i + 1})`;
                style = "fill:#fff1e6,stroke:#ffc09f";
            } else if (message.role === "tool") {
                nodeId = `tool_${message.tool_use_id}`;
                label = `Tool Result (${message.tool_use_id.substring(0, 4)}...)`;
                style = "fill:#f6ffed,stroke:#b7eb8f";
            } else {
                continue;
            }

            mermaidCode += `    ${nodeId}["${label}"]\n`;
            mermaidCode += `    classDef ${nodeId.replace(/[^a-zA-Z0-9]/g, '')} fill-color: ${style};\n`;
        }

        // 2. Define Edges (Dependencies)
        for (let i = 0; i < messages.length - 1; i++) {
            const currentMessage = messages[i];
            const nextMessage = messages[i + 1];

            let sourceId: string;
            let targetId: string;

            if (currentMessage.role === "user") {
                sourceId = `user_${i + 1}`;
            } else if (currentMessage.role === "assistant") {
                sourceId = `assistant_${i + 1}`;
            } else {
                continue;
            }

            if (nextMessage.role === "tool") {
                targetId = `tool_${nextMessage.tool_use_id}`;
            } else if (nextMessage.role === "assistant") {
                targetId = `assistant_${i + 2}`; // Approximation for next assistant step
            } else {
                continue;
            }

            // Advanced Edge Styling: Curvature based on role transition
            let edgeStyle = "stroke-width:2px,stroke:#333";
            if (currentMessage.role === "user" && nextMessage.role === "assistant") {
                edgeStyle = "stroke-width:3px,stroke:#007bff,curve:linear";
            } else if (currentMessage.role === "assistant" && nextMessage.role === "tool") {
                edgeStyle = "stroke-width:3px,stroke:#28a745,curve:bezier";
            }

            mermaidCode += `    ${sourceId} -->|Dependency| ${targetId}:::${sourceId.replace(/[^a-zA-Z0-9]/g, '')} ${edgeStyle}\n`;
        }

        // 3. Apply Classes (Simplified for demonstration)
        mermaidCode += "\n%% Apply Styles\n";
        mermaidCode += `classDef user fill:#e6f7ff,stroke:#91d5ff;\n`;
        mermaidCode += `classDef assistant fill:#fff1e6,stroke:#ffc09f;\n`;
        mermaidCode += `classDef tool fill:#f6ffed,stroke:#b7eb8f;\n`;


        return mermaidCode;
    }

    /**
     * Renders the dependency graph as a Mermaid compatible string.
     * @param messages Array of sequential messages.
     * @returns The Mermaid graph definition string.
     */
    public render(messages: Message[]): string {
        if (!messages || messages.length === 0) {
            return "graph TD; A[No messages provided]";
        }
        return this.generateMermaidGraph(messages);
    }
}