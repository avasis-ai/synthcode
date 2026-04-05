import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV27 {
    private readonly config: {
        mermaidVersion: "v27";
        // Placeholder for v27 specific configuration options
        [key: string]: any;
    };

    constructor(config: { mermaidVersion: "v27"; [key: string]: any }) {
        this.config = config;
        if (config.mermaidVersion !== "v27") {
            throw new Error("Invalid Mermaid version specified. Expected v27.");
        }
    }

    private generateNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        const contentSnippet = message.content.length > 10 ? message.content.substring(0, 5).toUpperCase() : "TXT";
        return `${rolePrefix}-${Math.floor(Math.random() * 1000)}-${index}`;
    }

    private generateToolCallNode(toolUse: ToolUseBlock, nodeId: string): string {
        return `node_${nodeId}["${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input)}"]`;
    }

    private generateMessageNode(message: Message, nodeId: string): string {
        if (message.role === "user") {
            return `node_${nodeId}["User Input: ${message.content.substring(0, 30)}..."]`;
        }
        if (message.role === "assistant") {
            const toolUses = (message as AssistantMessage).content.filter((block): block is ToolUseBlock => block.type === "tool_use");
            if (toolUses.length > 0) {
                return `node_${nodeId}["Assistant (Tool Calls): ${toolUses.length} calls"]`;
            }
            return `node_${nodeId}["Assistant Response: ${message.content.filter((block): block is TextBlock => block.type === "text").map(block => block.text).join('').substring(0, 30)}..."]`;
        }
        if (message.role === "tool") {
            return `node_${nodeId}["Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}..."]`;
        }
        return `node_${nodeId}["Unknown Message"]`;
    }

    private generateDependencies(messages: Message[]): string {
        let edges = "";
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];

            const currentId = this.generateNodeId(current, i);
            const nextId = this.generateNodeId(next, i + 1);

            if (current.role === "user" && next.role === "assistant") {
                edges += `link_${i}-->${i+1}["Calls for"]\n`;
            } else if (current.role === "assistant" && next.role === "tool") {
                edges += `link_${i}-->${i+1}["Executes"]\n`;
            } else if (current.role === "tool" && next.role === "assistant") {
                edges += `link_${i}-->${i+1}["Processes Result"]\n`;
            } else {
                edges += `link_${i}-->${i+1}["Continues"]\n`;
            }
        }
        return edges;
    }

    public visualize(messages: Message[]): string {
        let nodes = "";
        let toolCallNodes = "";
        let messageNodes = "";
        let edges = "";

        const messageIds: { [key: number]: string } = {};

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const nodeId = this.generateNodeId(message, i);
            messageIds[i] = nodeId;

            if (message.role === "user") {
                messageNodes += this.generateMessageNode(message, nodeId) + "\n";
            } else if (message.role === "assistant") {
                const toolUses = (message as AssistantMessage).content.filter((block): block is ToolUseBlock => block.type === "tool_use");
                if (toolUses.length > 0) {
                    toolCallNodes += toolUses.map((toolUse, index) =>
                        this.generateToolCallNode(toolUse, `${nodeId}-tool-${index}`)
                    ).join(" ");
                    messageNodes += this.generateMessageNode(message, nodeId) + "\n";
                } else {
                    messageNodes += this.generateMessageNode(message, nodeId) + "\n";
                }
            } else if (message.role === "tool") {
                messageNodes += this.generateMessageNode(message, nodeId) + "\n";
            }
        }

        edges = this.generateDependencies(messages);

        const mermaidDiagram = `
graph TD;
    %% V27 Specific Metadata Start %%
    %% Graph Version: ${this.config.mermaidVersion}
    %% Compatibility Layer: Advanced Tool Call Dependency Graph
    %% V27 Feature Flag: ${this.config.hasOwnProperty('v27_enabled') ? 'true' : 'false'} %%
    %% V27 Metadata End %%
    
    ${messageNodes}
    ${toolCallNodes}
    ${edges}
`;

        return mermaidDiagram.trim();
    }
}