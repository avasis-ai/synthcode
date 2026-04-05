import { GraphVisualizer, Message, ContentBlock, ToolUseBlock } from "./graph-visualizer-base";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV12 implements GraphVisualizer {
    constructor() {
        super();
    }

    private extractToolCalls(messages: Message[]): { toolCalls: ToolUseBlock[]; messageMap: Map<string, ToolUseBlock> } {
        const toolCalls: ToolUseBlock[] = [];
        const messageMap = new Map<string, ToolUseBlock>();

        for (const message of messages) {
            if (message.role === "assistant") {
                for (const block of (message as any).content || []) {
                    if (block.type === "tool_use") {
                        const toolUseBlock = block as ToolUseBlock;
                        toolCalls.push(toolUseBlock);
                        messageMap.set(toolUseBlock.id, toolUseBlock);
                    }
                }
            }
        }
        return { toolCalls, messageMap };
    }

    private generateMermaidGraph(messages: Message[]): string {
        const { toolCalls, messageMap } = this.extractToolCalls(messages);

        let mermaid = "graph TD\n";
        let nodeDefinitions: string[] = [];
        let edgeDefinitions: string[] = [];

        // 1. Define Nodes (User, Assistant, Tool Calls)
        const userNodeId = "User";
        nodeDefinitions.push(`    ${userNodeId}["User Input"]`);

        const assistantNodeId = "Assistant";
        nodeDefinitions.push(`    ${assistantNodeId}["Assistant Response"]`);

        toolCalls.forEach((toolUse, index) => {
            const nodeId = `Tool_${toolUse.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            nodeDefinitions.push(`    ${nodeId}["Tool Call: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input)}"]`);
        });

        // 2. Define Edges (Flow)
        // User -> Assistant
        edgeDefinitions.push(`    ${userNodeId} --> ${assistantNodeId} : Initiates Call`);

        // Assistant -> Tool Calls
        let lastAssistantNode = "Assistant";
        toolCalls.forEach((toolUse, index) => {
            const nodeId = `Tool_${toolUse.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            // Advanced V12: Use specific tool call dependency syntax
            edgeDefinitions.push(`    ${lastAssistantNode} --(calls)--> ${nodeId} : Calls Tool`);
            lastAssistantNode = nodeId; // Subsequent tool calls might depend on the previous one's result context
        });

        // Tool Calls -> Tool Results (Implicitly handled by the flow, but we model the result step)
        // For simplicity in this advanced version, we assume the final result feeds back to the assistant context.
        if (toolCalls.length > 0) {
            const lastToolNodeId = `Tool_${toolCalls[toolCalls.length - 1].id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            edgeDefinitions.push(`    ${lastToolNodeId} --(result)--> ${assistantNodeId} : Returns Result`);
        }

        // 3. Assemble Mermaid String
        mermaid.push(...nodeDefinitions.join("\n"));
        mermaid += "\n";
        mermaid += "%% Edges\n";
        mermaid.push(...edgeDefinitions.join("\n"));

        return mermaid;
    }

    public visualize(messages: Message[]): string {
        if (!messages || messages.length === 0) {
            return "graph TD\n    Start-->End : No messages provided.";
        }

        return this.generateMermaidGraph(messages);
    }
}