import { GraphContext, Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
    private readonly graphTitle: string;

    constructor(graphTitle: string = "Tool Call Dependency Graph") {
        this.graphTitle = graphTitle;
    }

    private generateNodeId(context: GraphContext, index: number): string {
        const source = context.messages[index];
        if (!source) return `node_${index}`;
        const rolePrefix = source.role === "user" ? "U" : source.role === "assistant" ? "A" : "T";
        return `${rolePrefix}_${index}`;
    }

    private generateNodeDefinition(nodeId: string, label: string, shape: string = "rounded"): string {
        return `${nodeId}["${label}"]:::${shape}Node`;
    }

    private generateEdgeDefinition(fromId: string, toId: string, label: string, type: "-->" | "---" = "-->"): string {
        return `${fromId} ${type} ${toId} :: "${label}"`;
    }

    private processMessageContent(message: Message, nodeId: string): string {
        let contentString = "";
        if (message.role === "user") {
            contentString = `User Input: "${message.content.text}"`;
        } else if (message.role === "assistant") {
            let blocks = message.content;
            let blockDescriptions: string[] = [];
            for (const block of blocks) {
                if (block.type === "text") {
                    blockDescriptions.push(`Text: "${block.text}"`);
                } else if (block.type === "tool_use") {
                    blockDescriptions.push(`Tool Use: ${block.name}(${JSON.stringify(block.input)})`);
                } else if (block.type === "thinking") {
                    blockDescriptions.push(`Thinking: "${block.thinking.substring(0, 30)}..."`);
                }
            }
            contentString = `Assistant Response:\n- ${blockDescriptions.join("\n- ")}`;
        } else if (message.role === "tool") {
            contentString = `Tool Result (${message.tool_use_id}): ${message.content}`;
        }
        return contentString;
    }

    public generateGraph(context: GraphContext): string {
        let nodes = [];
        let edges = [];
        let mermaidDirectives = `graph TD\n`;
        mermaidDirectives += `%% Advanced Tool Call Dependency Graph\n`;
        mermaidDirectives += `%% Title: ${this.graphTitle}\n`;
        mermaidDirectives += `%% Styling for clarity\n`;
        mermaidDirectives += `classDef userNode fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px;`;
        mermaidDirectives += `classDef assistantNode fill:#f6ffed,stroke:#b7d7c4,stroke-width:2px;`;
        mermaidDirectives += `classDef toolNode fill:#fff1f0,stroke:#ffc09f,stroke-width:2px;`;
        mermaidDirectives += `classDef flowControlNode fill:#fffbe6,stroke:#ffe58f,stroke-width:2px;`;

        let currentNodeId: string = "Start";
        let nodeCounter = 0;

        // 1. Process Messages to create primary nodes
        for (let i = 0; i < context.messages.length; i++) {
            const message = context.messages[i];
            const nodeId = this.generateNodeId(context, i);
            let label = "";
            let shape = "rounded";

            if (message.role === "user") {
                label = `User Message ${i + 1}`;
                nodes.push(this.generateNodeDefinition(nodeId, label, "user"));
                edges.push(this.generateEdgeDefinition(currentNodeId, nodeId, "Start of User Turn", "-->"));
                currentNodeId = nodeId;
            } else if (message.role === "assistant") {
                label = `Assistant Turn ${i + 1}`;
                nodes.push(this.generateNodeDefinition(nodeId, label, "assistant"));
                edges.push(this.generateEdgeDefinition(currentNodeId, nodeId, "Assistant Output", "-->"));
                currentNodeId = nodeId;
            } else if (message.role === "tool") {
                label = `Tool Result ${i + 1}`;
                nodes.push(this.generateNodeDefinition(nodeId, label, "tool"));
                edges.push(this.generateEdgeDefinition(currentNodeId, nodeId, "Tool Result Received", "-->"));
                currentNodeId = nodeId;
            }
        }

        // 2. Add detailed content/logic nodes (Conceptual representation for advanced flow)
        let lastNodeId = currentNodeId;
        let conceptualStepId = "Concept_Start";
        nodes.push(this.generateNodeDefinition(conceptualStepId, "System Start", "flow"));
        edges.push(this.generateEdgeDefinition("Start", conceptualStepId, "Initialization", "-->"));
        let currentFlowNodeId = conceptualStepId;

        // Simplified loop/conditional representation placeholder
        if (context.messages.length > 1) {
            let loopStartId = "Loop_Check";
            nodes.push(this.generateNodeDefinition(loopStartId, "Check Dependencies/Loop", "flow"));
            edges.push(this.generateEdgeDefinition(lastNodeId, loopStartId, "Requires Re-evaluation", "-->"));
            currentFlowNodeId = loopStartId;
        }

        // 3. Assemble Mermaid Syntax
        let nodeDefinitions = nodes.join("\n");
        let edgeDefinitions = edges.join("\n");

        let graphSyntax = `${mermaidDirectives}\n`;
        graphSyntax += `${nodeDefinitions}\n`;
        graphSyntax += `${edgeDefinitions}\n`;

        return graphSyntax;
    }
}