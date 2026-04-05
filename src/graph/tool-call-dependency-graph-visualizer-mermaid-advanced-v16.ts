import { GraphContext, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV16 {
    private context: GraphContext;

    constructor(context: GraphContext) {
        this.context = context;
    }

    private generateNodeId(message: Message, index: number): string {
        if (message.role === "user") {
            return `user_${message.content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}_${index}`;
        }
        if (message.role === "assistant") {
            return `assistant_${index}`;
        }
        if (message.role === "tool") {
            return `tool_${message.tool_use_id}_${index}`;
        }
        return `unknown_${Math.random().toString(36).substring(2, 9)}`;
    }

    private getNodeMermaidSyntax(message: Message, index: number): string {
        const nodeId = this.generateNodeId(message, index);
        let shape = "rect";
        let label = "";

        if (message.role === "user") {
            shape = "rounded";
            label = `User Input`;
        } else if (message.role === "assistant") {
            if (message.content.some((block) => block.type === "tool_use")) {
                shape = "hexagon";
                label = "Assistant Response (Tool Call)";
            } else {
                shape = "rect";
                label = "Assistant Response";
            }
        } else if (message.role === "tool") {
            shape = "stadium";
            label = `Tool Result (${message.tool_use_id})`;
        }

        return `node_${nodeId}["${label}"]:::${message.role}_node`;
    }

    private getLinkMermaidSyntax(fromMessage: Message, toMessage: Message, linkType: "call" | "result"): string {
        const fromId = this.generateNodeId(fromMessage, 0);
        const toId = this.generateNodeId(toMessage, 0);

        if (linkType === "call") {
            return `${fromId} -->|Calls| ${toId}`;
        } else if (linkType === "result") {
            return `${fromId} -->|Result| ${toId}`;
        }
        return "";
    }

    public renderGraph(messages: Message[]): string {
        if (!messages || messages.length === 0) {
            return "graph TD\n    A[No messages to visualize]";
        }

        let mermaidCode = "graph TD\n";
        const nodeDefinitions: string[] = [];
        const linkDefinitions: string[] = [];

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const nodeId = this.generateNodeId(message, i);
            nodeDefinitions.push(this.getNodeMermaidSyntax(message, i));
        }

        // Add custom styling for advanced nodes/links
        mermaidCode += `classDef user_node fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px;
            classDef assistant_node fill:#f0f9ff,stroke:#a0c4ff,stroke-width:2px;
            classDef tool_node fill:#fff1f0,stroke:#ffc09f,stroke-width:2px;
            classDef tool_use_node fill:#ffe5e6,stroke:#ffadd2,stroke-width:2px;`;

        // Add nodes
        mermaidCode += nodeDefinitions.join('\n    ');

        // Add links (simplified dependency flow)
        for (let i = 0; i < messages.length - 1; i++) {
            const fromMsg = messages[i];
            const toMsg = messages[i + 1];

            let link = "";
            if (fromMsg.role === "assistant" && toMsg.role === "tool") {
                link = this.getLinkMermaidSyntax(fromMsg, toMsg, "call");
            } else if (fromMsg.role === "tool" && toMsg.role === "assistant") {
                link = this.getLinkMermaidSyntax(fromMsg, toMsg, "result");
            } else if (fromMsg.role === "user" && toMsg.role === "assistant") {
                link = this.getLinkMermaidSyntax(fromMsg, toMsg, "call");
            } else {
                // Default sequential link
                link = `${this.generateNodeId(fromMsg, i)} --> ${this.generateNodeId(toMsg, i + 1)}[Continues]`;
            }
            if (link) {
                linkDefinitions.push(link);
            }
        }

        mermaidCode += '\n' + linkDefinitions.join('\n    ');

        return mermaidCode;
    }
}