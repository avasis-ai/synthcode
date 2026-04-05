import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV13 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private extractToolCalls(messages: Message[]): { toolUses: ToolUseBlock[]; toolResults: { tool_use_id: string; content: string; is_error?: boolean }[] } {
        const toolUses: ToolUseBlock[] = [];
        const toolResults: { tool_use_id: string; content: string; is_error?: boolean }[] = [];

        for (const message of messages) {
            if (message.role === "assistant") {
                for (const block of (message as any).content) {
                    if (block.type === "tool_use") {
                        toolUses.push(block as ToolUseBlock);
                    }
                }
            } else if (message.role === "tool") {
                toolResults.push({
                    tool_use_id: message.tool_use_id,
                    content: message.content,
                    is_error: (message as any).is_error
                });
            }
        }
        return { toolUses, toolResults };
    }

    private generateMermaidGraph(toolUses: ToolUseBlock[], toolResults: { tool_use_id: string; content: string; is_error?: boolean }[]): string {
        let mermaid = "graph TD;\n";
        let nodeCounter = 1;

        const getUniqueId = (prefix: string): string => `${prefix}${nodeCounter++}`;

        // 1. Define Nodes
        const toolUseNodes: Map<string, string> = new Map();
        toolUses.forEach((use, index) => {
            const nodeId = getUniqueId("TU");
            toolUseNodes.set(use.id, nodeId);
            mermaid += `    ${nodeId}["Tool Call: ${use.name}\\nInput: ${JSON.stringify(use.input)}"]:::tool-call-node\n`;
        });

        const toolResultNodes: Map<string, string> = new Map();
        toolResults.forEach((result, index) => {
            const nodeId = getUniqueId("TR");
            toolResultNodes.set(result.tool_use_id, nodeId);
            const errorStyle = result.is_error ? "style fill:#f99,stroke:#333" : "style fill:#9f9,stroke:#333";
            mermaid += `    ${nodeId}["Tool Result (ID: ${result.tool_use_id})\\nContent: ${result.content.substring(0, 50)}..."]:::tool-result-node ${errorStyle}\n`;
        });

        // 2. Define Edges (Dependencies)
        toolUses.forEach((use, index) => {
            const sourceNodeId = toolUseNodes.get(use.id)!;

            // Link Tool Use -> Tool Result
            const correspondingResult = toolResults.find(r => r.tool_use_id === use.id);
            if (correspondingResult) {
                const targetNodeId = toolResultNodes.get(use.id)!;
                mermaid += `    ${sourceNodeId} -->|Calls| ${targetNodeId};\n`;
            }
        });

        // 3. Define Styling (V13 Richer Styling)
        mermaid += "\n%% Styling for V13\n";
        mermaid += "classDef tool-call-node fill:#ccf,stroke:#666,stroke-width:2px;\n";
        mermaid += "classDef tool-result-node fill:#cfc,stroke:#333,stroke-width:2px;\n";
        mermaid += "classDef error-result fill:#fdd,stroke:#c00,stroke-width:2px;\n";

        return mermaid;
    }

    public visualize(): string {
        if (!this.messages || this.messages.length === 0) {
            return "graph TD; A[No messages provided]";
        }

        const { toolUses, toolResults } = this.extractToolCalls(this.messages);

        if (toolUses.length === 0 && toolResults.length === 0) {
            return "graph TD; A[No tool calls or results found in the message history]";
        }

        return this.generateMermaidGraph(toolUses, toolResults);
    }
}

export const createToolCallDependencyGraphVisualizerMermaidAdvancedV13 = (messages: Message[]): ToolCallDependencyGraphVisualizerMermaidAdvancedV13 => {
    return new ToolCallDependencyGraphVisualizerMermaidAdvancedV13(messages);
};