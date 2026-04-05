import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV114 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private getNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        return `${rolePrefix}-${index}`;
    }

    private getToolCallNodeId(message: Message, index: number, toolUseId: string): string {
        return `ToolCall-${toolUseId}`;
    }

    private generateNodeStyle(role: "user" | "assistant" | "tool"): string {
        switch (role) {
            case "user":
                return "style fill:#b3e0ff,stroke:#336699,stroke-width:2px";
            case "assistant":
                return "style fill:#ccffcc,stroke:#669933,stroke-width:2px";
            case "tool":
                return "style fill:#fff2cc,stroke:#ffcc00,stroke-width:2px";
            default:
                return "style fill:#eee,stroke:#ccc,stroke-width:1px";
        }
    }

    private generateToolCallNode(message: Message, index: number, toolUseBlock: ToolUseBlock): { id: string; label: string; style: string } {
        const nodeId = this.getToolCallNodeId(message, index, toolUseBlock.id);
        const label = `${toolUseBlock.name}(${toolUseBlock.id.substring(0, 4)}...)`;
        return {
            id: nodeId,
            label: label,
            style: "style fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px"
        };
    }

    private buildGraphDefinition(nodes: Map<string, { id: string; label: string; style: string }>, edges: { from: string; to: string; label: string; type: string }[]): string {
        let mermaid = "graph TD;\n";

        // 1. Define Nodes with Styles
        nodes.forEach((node, id) => {
            mermaid += `${id}["${node.label}"] ${node.style};\n`;
        });

        // 2. Define Edges
        edges.forEach(edge => {
            let edgeSyntax = `${edge.from} -- "${edge.label}" --> ${edge.to}`;

            if (edge.type === "conditional-fallback") {
                // Novel edge type syntax: Use a specific dashed/dotted style and label
                mermaid += `${edge.from} -.->|Fallback: ${edge.label}| ${edge.to};\n`;
            } else if (edge.type === "tool-call-sequence") {
                // Specific styling for tool execution flow
                mermaid += `${edge.from} -->|Executes| ${edge.to};\n`;
            } else {
                mermaid += `${edgeSyntax};\n`;
            }
        });

        return mermaid;
    }

    public visualize(mermaidGraph: string): string {
        const nodes = new Map<string, { id: string; label: string; style: string }>();
        const edges: { from: string; to: string; label: string; type: string }[] = [];
        let nodeCounter = 0;

        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            const messageId = this.getNodeId(message, i);

            if (message.role === "user") {
                nodes.set(messageId, { id: messageId, label: message.content.map(block => block.type === "text" ? block.text : "").join(" "), style: this.generateNodeStyle("user") });
            } else if (message.role === "assistant") {
                let contentText = "";
                let toolUseBlocks: ToolUseBlock[] = [];
                let thinkingContent = "";

                for (const block of message.content) {
                    if (block.type === "text") {
                        contentText += block.text + " ";
                    } else if (block.type === "tool_use") {
                        const toolUse = block as ToolUseBlock;
                        const toolNode = this.generateToolCallNode(message, i, toolUse);
                        nodes.set(toolNode.id, toolNode);
                        toolUseBlocks.push(toolUse);
                        contentText += `[Tool Use: ${toolUse.name}] `;
                    } else if (block.type === "thinking") {
                        thinkingContent = block.thinking;
                    }
                }

                // 1. Create main assistant node (if content exists)
                const assistantNode = { id: messageId, label: contentText.trim() || (thinkingContent ? `Thinking: ${thinkingContent.substring(0, 30)}...` : "Assistant Response"), style: this.generateNodeStyle("assistant") };
                nodes.set(messageId, assistantNode);

                // 2. Handle Tool Calls and Dependencies
                if (toolUseBlocks.length > 0) {
                    let lastToolNodeId: string | null = null;
                    for (let j = 0; j < toolUseBlocks.length; j++) {
                        const toolUse = toolUseBlocks[j];
                        const toolNode = this.generateToolCallNode(message, i, toolUse);
                        const toolNodeId = toolNode.id;

                        // Link from Assistant Message to Tool Call Node
                        edges.push({ from: messageId, to: toolNodeId, label: "Calls", type: "tool-call-sequence" });

                        // Link between sequential tool calls (if multiple)
                        if (lastToolNodeId) {
                            edges.push({ from: lastToolNodeId, to: toolNodeId, label: "Follows", type: "tool-call-sequence" });
                        }
                        lastToolNodeId = toolNodeId;
                    }
                }

                // 3. Simulate Conditional Fallback (Example: If the last tool call fails, it might fall back to text)
                if (toolUseBlocks.length > 0 && message.content.some(block => block.type === "thinking" && block.thinking.includes("fallback"))) {
                    const lastToolNodeId = lastToolNodeId!;
                    const fallbackTargetId = `${messageId}-fallback`;
                    nodes.set(fallbackTargetId, { id: fallbackTargetId, label: "Fallback Path Taken", style: "style fill:#ffdddd,stroke:#cc0000,stroke-width:2px" });
                    edges.push({ from: lastToolNodeId, to: fallbackTargetId, label: "Fallback", type: "conditional-fallback" });
                }
            } else if (message.role === "tool") {
                const toolMessage = message as ToolResultMessage;
                const toolNodeId = `${messageId}-result`;
                nodes.set(toolNodeId, { id: toolNodeId, label: `Tool Result (${toolMessage.tool_use_id}): ${toolMessage.content.substring(0, 20)}...`, style: this.generateNodeStyle("tool") });

                // Link from previous step (assuming the previous step was the tool call that generated this result)
                // This is a simplification, assuming the previous message was the one that initiated the tool call.
                if (i > 0 && this.messages[i - 1].role === "assistant" && this.messages[i - 1].content.some(block => block.type === "tool_use")) {
                    const prevAssistantId = this.getNodeId(this.messages[i - 1], i - 1);
                    edges.push({ from: prevAssistantId, to: toolNodeId, label: "Result Received", type: "tool-call-sequence" });
                }
            }
        }

        return this.buildGraphDefinition(nodes, edges);
    }
}