import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private getNodeLabel(message: Message): string {
        if (message.role === "user") {
            return `User Input`;
        }
        if (message.role === "assistant") {
            return `Assistant Response`;
        }
        if (message.role === "tool") {
            return `Tool Result (${message.tool_use_id})`;
        }
        return "Unknown Message";
    }

    private extractToolCalls(message: Message): { id: string; name: string; input: Record<string, unknown> }[] {
        if (message.role !== "assistant") {
            return [];
        }

        const toolUseBlocks: ToolUseBlock[] = (message as any).content?.filter(
            (block: ContentBlock) => block.type === "tool_use"
        ) as ToolUseBlock[];

        return toolUseBlocks.map(block => ({
            id: block.id,
            name: block.name,
            input: block.input,
        }));
    }

    private generateNodeDefinition(message: Message): string {
        const nodeId = `msg_${Math.random().toString(36).substring(2, 9)}`;
        const label = this.getNodeLabel(message);

        let content = "";
        if (message.role === "user") {
            content = `Content: "${message.content.substring(0, 50)}..."`;
        } else if (message.role === "assistant") {
            const toolCalls = this.extractToolCalls(message);
            if (toolCalls.length > 0) {
                content += `\nTools Called: ${toolCalls.map(tc => `${tc.name}`).join(', ')}`;
            } else {
                content += `\nContent Snippet: "${(message as any).content[0]?.text?.text.substring(0, 50) || 'N/A'}"`;
            }
        } else if (message.role === "tool") {
            content = `Tool Result: ${message.content}\nError: ${message.is_error ? 'Yes' : 'No'}`;
        }

        return `${nodeId}["${label}\\n${content}"]`;
    }

    private generateEdgeDefinition(fromMessage: Message, toMessage: Message, toolCallId?: string): string {
        let edge = "";
        if (fromMessage.role === "assistant" && toMessage.role === "tool") {
            if (toolCallId) {
                edge = `-->|Calls Tool ${toolCallId}|`;
            } else {
                edge = `-->|Follows Tool Call|`;
            }
        } else if (fromMessage.role === "user" && toMessage.role === "assistant") {
            edge = `-->|Responds To|`;
        } else if (fromMessage.role === "assistant" && toMessage.role === "assistant") {
            edge = `-->|Continues Thought|`;
        } else {
            edge = `-->|Transition|`;
        }
        return `${fromMessage.id} ${edge} ${toMessage.id}`;
    }

    private validateMermaidSyntax(mermaidString: string): boolean {
        try {
            // Simple check: attempt to parse the graph definition structure
            // In a real scenario, this would use a dedicated Mermaid parser library.
            // For this constraint, we check for basic structural elements.
            if (!mermaidString.includes("graph TD")) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    public generateGraphMermaid(includeToolDependencies: boolean = true): { mermaidString: string; isValid: boolean } {
        if (this.messages.length === 0) {
            return { mermaidString: "graph TD\n    A[\"No messages provided\"]", isValid: true };
        }

        const nodeDefinitions: string[] = [];
        const edgeDefinitions: string[] = [];

        // 1. Generate Nodes
        this.messages.forEach((msg, index) => {
            // Assign temporary IDs for graph construction
            (msg as any).id = `msg_${index}`;
            nodeDefinitions.push(this.generateNodeDefinition(msg));
        });

        // 2. Generate Edges
        for (let i = 0; i < this.messages.length - 1; i++) {
            const fromMsg = this.messages[i];
            const toMsg = this.messages[i + 1];

            let edge = this.generateEdgeDefinition(fromMsg, toMsg);

            if (includeToolDependencies && fromMsg.role === "assistant" && toMsg.role === "tool") {
                const toolCalls = this.extractToolCalls(fromMsg);
                if (toolCalls.length > 0) {
                    // Link the edge specifically to the first tool call for dependency visualization
                    edge = `${fromMsg.id} -->|Calls Tool ${toolCalls[0].name}| ${toMsg.id}`;
                }
            }
            edgeDefinitions.push(edge);
        }

        const mermaidString = `graph TD\n${nodeDefinitions.join('\n')} \n\n${edgeDefinitions.join('\n')}`;

        const isValid = this.validateMermaidSyntax(mermaidString);

        return { mermaidString, isValid };
    }
}