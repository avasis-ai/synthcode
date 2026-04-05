import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV121 {
    private readonly graphTitle: string;

    constructor(graphTitle: string = "Tool Call Dependency Graph (v121)") {
        this.graphTitle = graphTitle;
    }

    private generateNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        const contentSnippet = message.content.length > 10 ? message.content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') : "Short";
        return `${rolePrefix}-${contentSnippet}-${index}`;
    }

    private generateToolUseNode(toolUse: ToolUseBlock, messageIndex: number, message: Message): string {
        const nodeId = `ToolUse-${message.role.substring(0, 1)}${messageIndex}-${toolUse.id.substring(0, 4)}`;
        return `    ${nodeId}["${toolUse.name}\\n(ID: ${toolUse.id})"]`;
    }

    private generateTextNode(text: TextBlock, messageIndex: number, message: Message): string {
        const nodeId = `Text-${message.role.substring(0, 0)}${messageIndex}-${Math.random().toString(36).substring(2, 5)}`;
        return `    ${nodeId}["${text.text.substring(0, 30).replace(/[\r\n]/g, "\\n")}..."]`;
    }

    private generateThinkingNode(thinking: ThinkingBlock, messageIndex: number, message: Message): string {
        const nodeId = `Think-${message.role.substring(0, 0)}${messageIndex}-${Math.random().toString(36).substring(2, 5)}`;
        return `    ${nodeId}["Thinking:\\n${thinking.thinking.substring(0, 30).replace(/[\r\n]/g, "\\n")}..."]`;
    }

    private processMessageContent(message: Message, messageIndex: number): string {
        let contentNodes: string[] = [];
        let lastNodeId: string | null = null;

        if (message.role === "assistant" && "content" in message && Array.isArray((message as any).content)) {
            const contentBlocks = (message as any).content as ContentBlock[];
            let currentBlockIndex = 0;
            for (const block of contentBlocks) {
                let nodeId: string;
                let nodeDefinition: string;

                if (block.type === "text") {
                    const textBlock = block as TextBlock;
                    nodeId = this.generateTextNode(textBlock, messageIndex, message);
                    nodeDefinition = `${nodeId.split('[')[1].replace(']','')} ${nodeId.split(']')[0]}`;
                    contentNodes.push(nodeDefinition);
                    lastNodeId = nodeDefinition.match(/\[[^\]]+\]/)[0].substring(1, nodeDefinition.length - 1);
                } else if (block.type === "tool_use") {
                    const toolUseBlock = block as ToolUseBlock;
                    nodeId = this.generateToolUseNode(toolUseBlock, messageIndex, message);
                    contentNodes.push(nodeId);
                    lastNodeId = nodeId.match(/\[[^\]]+\]/)[0].substring(1, nodeId.length - 1);
                } else if (block.type === "thinking") {
                    const thinkingBlock = block as ThinkingBlock;
                    nodeId = this.generateThinkingNode(thinkingBlock, messageIndex, message);
                    contentNodes.push(nodeId);
                    lastNodeId = nodeId.match(/\[[^\]]+\]/)[0].substring(1, nodeId.length - 1);
                }
                currentBlockIndex++;
            }
        } else if (message.role === "user" && "content" in message && typeof (message as any).content === "string") {
            const textBlock = { type: "text", text: (message as any).content };
            const nodeId = this.generateTextNode(textBlock, messageIndex, message);
            contentNodes.push(nodeId);
            lastNodeId = nodeId.match(/\[[^\]]+\]/)[0].substring(1, nodeId.length - 1);
        }

        return { nodes: contentNodes.join('\n'), lastNodeId };
    }

    public render(messages: Message[]): string {
        let mermaidCode = `graph TD\n`;
        mermaidCode += `    subgraph ${this.graphTitle.replace(/[^a-zA-Z0-9]/g, '')}
`;

        let lastGlobalNodeId: string | null = null;

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const messageIndex = i;

            let messageNodes: string = "";
            let lastMessageNodeId: string | null = null;

            if (message.role === "user") {
                const userContent = message.content as string;
                const textBlock: TextBlock = { type: "text", text: userContent };
                const nodeId = this.generateTextNode(textBlock, messageIndex, message);
                messageNodes = nodeId;
                lastMessageNodeId = nodeId.match(/\[[^\]]+\]/)[0].substring(1, nodeId.length - 1);
            } else if (message.role === "assistant") {
                const contentResult = this.processMessageContent(message, messageIndex);
                messageNodes = contentResult.nodes;
                lastMessageNodeId = contentResult.lastNodeId;
            } else if (message.role === "tool") {
                const toolMessage = message as ToolResultMessage;
                const nodeId = `ToolResult-${messageIndex}-${toolMessage.tool_use_id.substring(0, 4)}`;
                messageNodes = `    ${nodeId}["Tool Result (${toolMessage.tool_use_id}): ${toolMessage.content.substring(0, 30)}..."]`;
                lastMessageNodeId = nodeId;
            }

            if (messageNodes) {
                mermaidCode += `    subgraph Message_${message.role.substring(0, 1)}${messageIndex}
${messageNodes}
    end\n`;

                if (lastGlobalNodeId) {
                    mermaidCode += `    ${lastGlobalNodeId} --> ${lastMessageNodeId || lastGlobalNodeId};\n`;
                }
                lastGlobalNodeId = lastMessageNodeId || lastGlobalNodeId;
            }
        }

        mermaidCode += `\n    end\n`;
        return mermaidCode;
    }
}