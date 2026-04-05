import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV5 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private extractToolCalls(message: Message): { toolUseId: string, toolName: string, input: Record<string, unknown> }[] {
        const toolUses: { toolUseId: string, toolName: string, input: Record<string, unknown> }[] = [];
        if (message.role === "assistant" && Array.isArray((message as any).content)) {
            for (const block of (message as any).content) {
                if (block.type === "tool_use") {
                    const toolUseBlock = block as ToolUseBlock;
                    toolUses.push({
                        toolUseId: toolUseBlock.id,
                        toolName: toolUseBlock.name,
                        input: toolUseBlock.input,
                    });
                }
            }
        }
        return toolUses;
    }

    private extractToolResults(message: Message): { toolUseId: string, content: string, isError: boolean }[] {
        const results: { toolUseId: string, content: string, isError: boolean }[] = [];
        if (message.role === "tool" && typeof (message as any).tool_use_id === 'string') {
            results.push({
                toolUseId: message['tool_use_id'],
                content: message.content,
                isError: (message as any).is_error || false,
            });
        }
        return results;
    }

    private generateMermaidGraph(graphTitle: string): string {
        let mermaid = `graph TD;\n`;
        mermaid += `%% Advanced Tool Call Dependency Graph Visualization v5\n`;
        mermaid += `%% Title: ${graphTitle}\n`;

        const nodes: Map<string, { id: string, label: string }> = new Map();
        const edges: string[] = [];
        const toolCallDependencies: Map<string, { source: string, target: string, label: string }> = new Map();

        // 1. Process Messages to create nodes and initial edges
        let messageCounter = 0;
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            const nodeId = `M${i}`;
            nodes.set(nodeId, { id: nodeId, label: `Role: ${message.role}` });

            // Add content details as sub-nodes or extensions
            if (message.role === "assistant") {
                const assistantContent = message as AssistantMessage;
                for (const block of assistantContent.content) {
                    if (block.type === "text") {
                        const textNodeId = `${nodeId}_T`;
                        nodes.set(textNodeId, { id: textNodeId, label: `Text: ${block.text.substring(0, 20)}...` });
                        edges.push(`${nodeId} --> ${textNodeId}`);
                    } else if (block.type === "tool_use") {
                        const toolUseBlock = block as ToolUseBlock;
                        const toolUseNodeId = `${nodeId}_TU_${toolUseBlock.id}`;
                        nodes.set(toolUseNodeId, { id: toolUseNodeId, label: `Tool Use: ${toolUseBlock.name}` });
                        edges.push(`${nodeId} --> ${toolUseNodeId}`);
                    }
                }
            } else if (message.role === "tool") {
                const toolResult = message as ToolResultMessage;
                const toolResultNodeId = `${nodeId}_TR`;
                nodes.set(toolResultNodeId, { id: toolResultNodeId, label: `Tool Result (${toolResult.tool_use_id})` });
                edges.push(`${nodeId} --> ${toolResultNodeId}`);
            }
        }

        // 2. Process Tool Calls and Dependencies (Core Logic)
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            const currentMessageId = `M${i}`;

            // A. Assistant -> Tool Use (Initiation)
            const toolUses = this.extractToolCalls(message);
            for (const toolUse of toolUses) {
                const toolUseNodeId = `${currentMessageId}_TU_${toolUse.toolUseId}`;
                nodes.set(toolUseNodeId, { id: toolUseNodeId, label: `Call: ${toolUse.toolName}` });
                edges.push(`${currentMessageId} --> ${toolUseNodeId}`);

                // Store dependency: Assistant -> Tool Use
                toolCallDependencies.set(toolUse.toolUseId, {
                    source: currentMessageId,
                    target: toolUseNodeId,
                    label: `Calls ${toolUse.toolName}`
                });
            }

            // B. Tool Result -> Subsequent Message (Consumption/Feedback)
            if (i + 1 < this.messages.length) {
                const nextMessage = this.messages[i + 1];
                const nextMessageId = `M${i + 1}`;

                if (message.role === "tool" && nextMessage.role === "assistant") {
                    const toolResult = message as ToolResultMessage;
                    const toolResultNodeId = `${currentMessageId}_TR`;
                    const nextAssistantContent = (nextMessage as AssistantMessage).content;

                    // Link Tool Result to the next step
                    edges.push(`${toolResultNodeId} --> ${nextMessageId}`);

                    // Advanced Feature: Link Tool Result to the specific tool use that generated it (if applicable)
                    // This assumes the next assistant message is responding to the result.
                    toolCallDependencies.set(toolResult.tool_use_id, {
                        source: toolResultNodeId,
                        target: nextMessageId,
                        label: `Responds to ${toolResult.tool_use_id}`
                    });
                }
            }
        }

        // 3. Construct Mermaid Syntax
        let nodeDefinitions = Array.from(nodes.values()).map(node => `${node.id}["${node.label}"]`);
        let edgeDefinitions = Array.from(new Set(edges)).join('; ');

        // 4. Advanced Syntax Implementation (Custom Styling/State Transitions)
        // We use a custom subgraph or class definition to simulate advanced state/styling based on role.
        let advancedSyntax = `\n%% Advanced Styling/State Definition\n`;
        advancedSyntax += `classDef userStyle fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px; classDef assistantStyle fill:#fff1f0,stroke:#ffadd2,stroke-width:2px; classDef toolResultStyle fill:#f6ffed,stroke:#b7eb8f,stroke-width:2px;`;

        // Apply classes to nodes
        nodeDefinitions = nodeDefinitions.map(def => {
            let nodeId = def.match(/(\w+)\[/)[1];
            let className = "";
            if (nodeId.startsWith("M") && this.messages[parseInt(nodeId.substring(1))].role === "user") {
                className = " userStyle";
            } else if (nodeId.startsWith("M") && this.messages[parseInt(nodeId.substring(1))].role === "assistant") {
                className = " assistantStyle";
            } else if (nodeId.includes("_TR")) {
                className = " toolResultStyle";
            }
            return `${def} ${className}`;
        }).join('; ');


        mermaid = `${mermaid.replace('graph TD;', 'graph TD')};\n`;
        mermaid += nodeDefinitions.join('; ') + ";\n";
        mermaid += edgeDefinitions + ";\n";
        mermaid += advancedSyntax;

        return mermaid;
    }

    /**
     * Generates the advanced Mermaid diagram string visualizing tool call dependencies.
     * @param graphTitle The title for the generated graph.
     * @returns The Mermaid diagram syntax string.
     */
    public visualize(graphTitle: string): string {
        return this.generateMermaidGraph(graphTitle);
    }
}