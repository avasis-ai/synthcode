import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV8 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private getToolCallNodes(message: Message): string[] {
        if (message.role !== "assistant") {
            return [];
        }

        const toolUseBlocks: ToolUseBlock[] = (message as AssistantMessage).content.filter(
            (block): block is ToolUseBlock => block.type === "tool_use"
        ) as ToolUseBlock[];

        return toolUseBlocks.map(block => `ToolCall_${block.id}`);
    }

    private getNodeMermaidSyntax(nodeId: string, label: string, type: "tool_call" | "user_input" | "assistant_response"): string {
        let style = "";
        if (type === "tool_call") {
            style = "style fill:#f9f,stroke:#333,stroke-width:2px";
        } else if (type === "user_input") {
            style = "style fill:#ccf,stroke:#333,stroke-width:2px";
        } else if (type === "assistant_response") {
            style = "style fill:#cfc,stroke:#333,stroke-width:2px";
        }
        return `${nodeId}["${label}"]${style}`;
    }

    private getEdgeMermaidSyntax(sourceId: string, targetId: string, label: string): string {
        return `${sourceId} -->|${label}| ${targetId}`;
    }

    private buildGraphStructure(): { nodes: string[]; edges: string[] } {
        const nodes: string[] = [];
        const edges: string[] = [];
        const toolCallNodes: Map<string, string> = new Map();

        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            let currentMessageNodes: string[] = [];

            if (message.role === "user") {
                const nodeId = `User_${i}`;
                const label = this.extractUserContent(message);
                nodes.push(this.getNodeMermaidSyntax(nodeId, label, "user_input"));
                currentMessageNodes.push(nodeId);
            } else if (message.role === "assistant") {
                const assistantMessage = message as AssistantMessage;
                const toolUseIds = this.getToolCallNodes(message);
                
                // Treat the whole assistant message as one node for simplicity, but highlight tool calls
                const nodeId = `Assistant_${i}`;
                const label = this.extractAssistantContent(message);
                nodes.push(this.getNodeMermaidSyntax(nodeId, label, "assistant_response"));
                currentMessageNodes.push(nodeId);

                // Add specific tool call nodes and link them internally
                toolUseIds.forEach((toolCallId, index) => {
                    const toolUseBlock = (assistantMessage.content.filter((block): block is ToolUseBlock => block.type === "tool_use")[index] as ToolUseBlock);
                    const toolCallNodeId = `ToolCall_${toolUseBlock.id}`;
                    const toolCallLabel = `${toolUseBlock.name} (Input: ${JSON.stringify(toolUseBlock.input)})`;
                    nodes.push(this.getNodeMermaidSyntax(toolCallNodeId, toolCallLabel, "tool_call"));
                    
                    // Link the main assistant node to the specific tool call node
                    edges.push(this.getEdgeMermaidSyntax(nodeId, toolCallNodeId, "Calls Tool"));
                });
            } else if (message.role === "tool") {
                const toolMessage = message as ToolResultMessage;
                const nodeId = `ToolResult_${message.tool_use_id}`;
                const label = `Tool Result (${toolMessage.tool_use_id}): ${toolMessage.content.substring(0, 30)}...`;
                nodes.push(this.getNodeMermaidSyntax(nodeId, label, "assistant_response")); // Reusing style for results
                currentMessageNodes.push(nodeId);
            }
        }

        // Link sequential messages
        for (let i = 0; i < this.messages.length - 1; i++) {
            const sourceId = this.getSequentialNodeId(this.messages[i]);
            const targetId = this.getSequentialNodeId(this.messages[i+1]);
            if (sourceId && targetId) {
                edges.push(this.getEdgeMermaidSyntax(sourceId, targetId, "Continues To"));
            }
        }

        return { nodes: nodes.join('\n'), edges: edges.join('\n') };
    }

    private getSequentialNodeId(message: Message): string | undefined {
        if (message.role === "user") return `User_${this.messages.indexOf(message)}`;
        if (message.role === "assistant") return `Assistant_${this.messages.indexOf(message)}`;
        if (message.role === "tool") return `ToolResult_${(message as ToolResultMessage).tool_use_id}`;
        return undefined;
    }

    private extractUserContent(message: Message): string {
        if (message.content.length > 0) {
            return (message.content[0] as TextBlock).text;
        }
        return "User Input";
    }

    private extractAssistantContent(message: Message): string {
        const blocks = (message as AssistantMessage).content;
        let textContent = "";
        let toolCallCount = 0;
        
        for (const block of blocks) {
            if (block.type === "text") {
                textContent += block.text + " ";
            } else if (block.type === "tool_use") {
                toolCallCount++;
            }
        }
        return `${textContent.trim()} (Contains ${toolCallCount} tool call(s))`;
    }

    public renderMermaidV8(): string {
        const { nodes, edges } = this.buildGraphStructure();

        const mermaidSyntax = `
graph TD
    %% Graph Definition Start
    ${nodes}
    %% Graph Definition End

    %% Edges
    ${edges}
`;
        return mermaidSyntax.trim();
    }
}