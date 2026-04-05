import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV102 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private extractToolCalls(messages: Message[]): { toolCalls: { id: string, name: string, input: Record<string, unknown> }[] } {
        const toolCalls: { id: string, name: string, input: Record<string, unknown> }[] = [];
        for (const message of messages) {
            if (message.role === "assistant") {
                for (const block of (message as any).content) {
                    if (block.type === "tool_use") {
                        const toolUseBlock: ToolUseBlock = block;
                        toolCalls.push({
                            id: toolUseBlock.id,
                            name: toolUseBlock.name,
                            input: toolUseBlock.input,
                        });
                    }
                }
            }
        }
        return { toolCalls };
    }

    private generateMermaidGraph(toolCalls: { id: string, name: string, input: Record<string, unknown> }[]): string {
        let mermaid = "graph TD;\n";
        mermaid += "    %% Advanced Tool Call Dependency Graph (v102)\n";
        mermaid += "    %% Nodes representing user input and assistant thinking\n";
        mermaid += "    A[User Input] --> B{Assistant Decision};\n";

        const toolCallNodes = toolCalls.map(tc => `T${tc.id.substring(0, 4)}["Tool: ${tc.name}\\n(Input: ${JSON.stringify(tc.input)})"]`).join(";\n");
        mermaid += `    B --> ${toolCallNodes};\n`;

        // Simulate dependencies/flow
        if (toolCalls.length > 0) {
            mermaid += `    T${toolCalls[0].id.substring(0, 4)} --> C{Tool Result 1};\n`;
            if (toolCalls.length > 1) {
                mermaid += `    T${toolCalls[1].id.substring(0, 4)} --> D{Tool Result 2};\n`;
            }
            mermaid += "    C --> E[Final Response];\n";
        } else {
            mermaid += "    B --> E[Final Response (No Tools)];\n";
        }

        // Custom subgraph grouping for advanced layout
        mermaid += "\nsubgraph Tool Execution Flow\n";
        mermaid += `    ${toolCallNodes.replace(/;/g, '---')}\n`;
        mermaid += "end\n";

        return mermaid;
    }

    public visualize(): string {
        const { toolCalls } = this.extractToolCalls(this.messages);
        return this.generateMermaidGraph(toolCalls);
    }
}