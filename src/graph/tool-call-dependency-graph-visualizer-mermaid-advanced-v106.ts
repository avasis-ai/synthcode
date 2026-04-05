import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV106 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private generateNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        const contentSnippet = message.content ? (message.content.length > 20 ? message.content.slice(0, 17) + "..." : message.content) : "NoContent";
        return `${rolePrefix}_${Math.floor(index / 2)}_${contentSnippet.replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    private renderToolCallDependencyEdge(fromId: string, toId: string, toolUseId: string): string {
        return `    ${fromId} --[dependency]-> ${toId} {ToolCall: ${toolUseId}}`;
    }

    private renderMessageNode(message: Message, index: number): string {
        let contentSummary: string;
        if (message.role === "user") {
            contentSummary = `User Input: "${message.content.substring(0, 30)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = message.content.filter((block): block is ToolUseBlock => block.type === "tool_use");
            if (toolUses.length > 0) {
                contentSummary = `Tool Calls: ${toolUses.map(t => t.name).join(", ")}`;
            } else {
                contentSummary = `Assistant Response: "${message.content.filter((block): block is TextBlock => block.type === "text").map(b => b.text).join("").substring(0, 30)}..."`;
            }
        } else if (message.role === "tool") {
            contentSummary = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        } else {
            contentSummary = "Unknown Content";
        }

        return `    node${index}["${message.role.toUpperCase()}: ${contentSummary}"]`;
    }

    public renderGraphMermaid(): string {
        let mermaid = "graph TD\n";
        let nodeDeclarations: string[] = [];
        let edgeDeclarations: string[] = [];

        this.messages.forEach((message, index) => {
            const nodeId = `node${index}`;
            nodeDeclarations.push(this.renderMessageNode(message, index));

            if (message.role === "assistant" && message.content) {
                const toolUses = message.content.filter((block): block is ToolUseBlock => block.type === "tool_use");
                if (toolUses.length > 0) {
                    toolUses.forEach((toolUse, toolIndex) => {
                        const toolCallId = `tool_call_${toolUse.id}`;
                        // Link from the main assistant node to the specific tool call dependency
                        edgeDeclarations.push(this.renderToolCallDependencyEdge(`node${index}`, toolCallId, toolUse.id));
                    });
                }
            }

            // General flow dependency: Previous message -> Current message
            if (index > 0) {
                const previousMessage = this.messages[index - 1];
                const previousNodeId = `node${index - 1}`;
                let edgeLabel = "";
                if (message.role === "tool" && previousMessage.role === "assistant") {
                    edgeLabel = "Tool Result Received";
                } else if (message.role === "user" && previousMessage.role === "assistant") {
                    edgeLabel = "User Follow-up";
                }
                edgeDeclarations.push(`    ${previousNodeId} -->|${edgeLabel}| ${nodeId}`);
            }
        });

        // Add tool call nodes explicitly if they were generated as dependencies
        const toolCallNodes = new Set<string>();
        this.messages.forEach((message, index) => {
            const toolUses = message.content.filter((block): block is ToolUseBlock => block.type === "tool_use");
            toolUses.forEach(toolUse => {
                const toolCallId = `tool_call_${toolUse.id}`;
                toolCallNodes.add(toolCallId);
            });
        });

        let toolCallNodeDeclarations: string[] = [];
        toolCallNodes.forEach(toolCallId => {
            toolCallNodeDeclarations.push(`    ${toolCallId}["Tool Use: ${toolCallId.split('_').pop() || 'Unknown'}"]`);
        });


        mermaid = `${nodeDeclarations.join('\n')}\n`;
        mermaid += toolCallNodeDeclarations.length > 0 ? toolCallNodeDeclarations.join('\n') + "\n" : "";
        mermaid += `${edgeDeclarations.join('\n')}`;

        return mermaid;
    }
}