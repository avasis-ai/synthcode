import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV6 {
    private messages: Message[];
    private advancedConfig: {
        defaultDirection?: "TD" | "LR";
        subgraphGrouping?: Record<string, string>;
        customStyles?: Record<string, string>;
    };

    constructor(messages: Message[], advancedConfig: {
        defaultDirection?: "TD" | "LR";
        subgraphGrouping?: Record<string, string>;
        customStyles?: Record<string, string>;
    }) {
        this.messages = messages;
        this.advancedConfig = advancedConfig;
    }

    private getDirection(): "TD" | "LR" {
        return this.advancedConfig.defaultDirection || "TD";
    }

    private generateNodeId(messageIndex: number, blockIndex: number): string {
        return `node_${messageIndex}_${blockIndex}`;
    }

    private generateNodeContent(block: ContentBlock): string {
        if (block.type === "text") {
            return block.text.substring(0, 30) + (block.text.length > 30 ? "..." : "");
        } else if (block.type === "tool_use") {
            return `Tool: ${block.name} (ID: ${block.id})`;
        } else if (block.type === "thinking") {
            return `Thinking: ${block.thinking.substring(0, 20)}...`;
        }
        return "Unknown Block";
    }

    private processMessage(message: Message, messageIndex: number): string {
        let mermaidNodes = "";
        let nodeCounter = 0;

        if (message.role === "assistant" && "content" in message && Array.isArray(message.content)) {
            for (let i = 0; i < message.content.length; i++) {
                const block = message.content[i] as ContentBlock;
                const nodeId = this.generateNodeId(messageIndex, i);
                const content = this.generateNodeContent(block);
                
                let style = "";
                if (block.type === "tool_use") {
                    style = `style ${nodeId} fill:#cceeff,stroke:#336699,stroke-width:2px`;
                } else if (block.type === "thinking") {
                    style = `style ${nodeId} fill:#fff0b3,stroke:#b88601,stroke-width:2px`;
                } else {
                    style = `style ${nodeId} fill:#e0f7fa,stroke:#00bcd4,stroke-width:1px`;
                }

                mermaidNodes += `${nodeId}[${content}] ${style}\n`;
                nodeCounter++;
            }
        } else if (message.role === "tool") {
            const nodeId = this.generateNodeId(messageIndex, 0);
            const content = `Tool Result: ${message.content.substring(0, 30)}...`;
            let style = message.is_error ? "style " + nodeId + " fill:#ffdddd,stroke:#cc0000,stroke-width:2px" : "style " + nodeId + " fill:#d4edda,stroke:#28a745,stroke-width:2px";
            mermaidNodes += `${nodeId}[${content}] ${style}\n`;
            nodeCounter++;
        } else if (message.role === "user") {
            const nodeId = this.generateNodeId(messageIndex, 0);
            const content = `User Input: ${message.content.substring(0, 30)}...`;
            mermaidNodes += `${nodeId}[${content}] style ${nodeId} fill:#e6e6fa,stroke:#9370db,stroke-width:2px\n`;
            nodeCounter++;
        }

        return { nodes: mermaidNodes, count: nodeCounter };
    }

    public generateMermaidCode(): string {
        let mermaidCode = `graph ${this.getDirection()} ${this.advancedConfig.defaultDirection ? `direction ${this.getDirection()}` : ''}\n`;
        
        let allNodes: string[] = [];
        let allLinks: string[] = [];
        let subgraphDirectives: string[] = [];

        let messageIndex = 0;
        for (const message of this.messages) {
            const { nodes: nodeMermaid, count: nodeCount } = this.processMessage(message, messageIndex);
            
            if (nodeCount > 0) {
                allNodes.push(nodeMermaid);
                
                // Simple linking logic: Link the current message's nodes to the previous message's last node (if any)
                if (messageIndex > 0) {
                    // This is a simplification; real dependency tracking is complex.
                    // We link the first node of the current message to the last node of the previous message.
                    const lastMessage = this.messages[messageIndex - 1];
                    const lastNodeId = this.generateNodeId(messageIndex - 1, Math.max(0, Math.floor(lastMessage.content?.length || 1) - 1));
                    
                    if (nodeMermaid.includes("node_")) {
                        const firstNodeId = nodeMermaid.match(/node_\d+_(\d+)/)?.[0] || "node_start";
                        allLinks.push(`${lastNodeId} --> ${firstNodeId}`);
                    }
                }
            }
            messageIndex++;
        }

        if (this.advancedConfig.subgraphGrouping) {
            for (const [groupName, messageRole] of Object.entries(this.advancedConfig.subgraphGrouping)) {
                subgraphDirectives.push(`subgraph ${groupName} ${messageRole}`);
            }
        }

        let finalCode = "";
        if (subgraphDirectives.length > 0) {
            finalCode += subgraphDirectives.join("\n") + "\n";
        }

        finalCode += allNodes.join("\n") + "\n";
        finalCode += allLinks.join("\n");

        return finalCode.trim();
    }
}