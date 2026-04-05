import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV28 {
    private messages: Message[];
    private advancedConfig: {
        showConditionalEdges: boolean;
        showLoopNodes: boolean;
        defaultEdgeStyle: string;
    };

    constructor(messages: Message[], advancedConfig: {
        showConditionalEdges: boolean;
        showLoopNodes: boolean;
        defaultEdgeStyle: string;
    }) {
        this.messages = messages;
        this.advancedConfig = advancedConfig;
    }

    private generateNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        return `${rolePrefix}-${Math.floor(index / 2)}-${Math.random().toString(36).substring(2, 5)}`;
    }

    private getNodeMermaid(message: Message, index: number): string {
        const nodeId = this.generateNodeId(message, index);
        let content = "";

        if (message.role === "user") {
            content = `User Input: "${message.content.substring(0, 30)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = (message.content as ContentBlock[]).filter(block => block.type === "tool_use");
            if (toolUses.length > 0) {
                content = `Assistant Response (Tools: ${toolUses.length})`;
            } else {
                content = `Assistant Text: "${(message.content as ContentBlock[])[0]?.text || 'No text'}..."`;
            }
        } else if (message.role === "tool") {
            content = `Tool Result: ${message.tool_use_id} (${message.content.substring(0, 30)}...)`;
        }

        let nodeDefinition = `node${nodeId}["${content}"]`;

        if (message.role === "assistant" && (message.content as ContentBlock[]).some(block => block.type === "tool_use")) {
            nodeDefinition += `:::tool_call_group`;
        } else if (message.role === "user") {
            nodeDefinition += `:::user_input`;
        } else {
            nodeDefinition += `:::message`;
        }

        return `${nodeDefinition}\n`;
    }

    private generateEdgeMermaid(sourceId: string, targetId: string, relationship: string, isConditional: boolean = false): string {
        let edge = `${sourceId} --> ${targetId}`;

        if (relationship === "calls") {
            edge = `${sourceId} -- calls --> ${targetId}`;
        } else if (relationship === "follows") {
            edge = `${sourceId} -->|follows| ${targetId}`;
        }

        if (isConditional && this.advancedConfig.showConditionalEdges) {
            edge = `-->|${relationship} (Conditional)| ${targetId}`;
        } else if (relationship === "loop") {
            return `linkStyle ${sourceId} fill:#ffdddd,stroke:#f00,stroke-width:2px;`;
        }

        return edge + "\n";
    }

    public visualize(mermaidGraphTitle: string = "Tool Call Dependency Graph"): string {
        let mermaidCode = `graph TD\n`;
        mermaidCode += `%% Advanced Tool Call Dependency Graph\n`;
        mermaidCode += `%% Config: Conditional Edges=${this.advancedConfig.showConditionalEdges}, Loop Nodes=${this.advancedConfig.showLoopNodes}\n\n`;

        const nodeDefinitions: string[] = [];
        const edgeDefinitions: string[] = [];
        let previousNodeId: string | null = null;

        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            const nodeId = this.generateNodeId(message, i);
            nodeDefinitions.push(this.getNodeMermaid(message, i));

            if (previousNodeId) {
                let relationship = "follows";
                let isConditional = false;

                if (message.role === "tool" && this.messages[i - 2]?.role === "assistant") {
                    relationship = "tool_result_for";
                } else if (message.role === "assistant" && this.messages[i - 1]?.role === "user") {
                    relationship = "responds_to";
                }

                if (relationship === "responds_to" && this.advancedConfig.showConditionalEdges) {
                    isConditional = true;
                }

                edgeDefinitions.push(this.generateEdgeMermaid(previousNodeId, nodeId, relationship, isConditional));
            }
            previousNodeId = this.generateNodeId(message, i);
        }

        // Add advanced loop handling if necessary (simplified for this structure)
        if (this.advancedConfig.showLoopNodes && this.messages.length > 1) {
            const firstNodeId = this.generateNodeId(this.messages[0], 0);
            const lastNodeId = this.generateNodeId(this.messages[this.messages.length - 1], this.messages.length - 1);
            mermaidCode += this.generateEdgeMermaid(lastNodeId, firstNodeId, "loop", false);
        }


        mermaidCode += "\n\n%% Styling Definitions\n";
        mermaidCode += `classDef user_input fill:#e6f7ff,stroke:#1890ff,stroke-width:2px;\n`;
        mermaidCode += `classDef tool_call_group fill:#fff1f0,stroke:#faad14,stroke-width:2px;\n`;
        mermaidCode += `classDef message fill:#f6ffed,stroke:#52c41a,stroke-width:2px;\n`;

        mermaidCode += "\n".join(nodeDefinitions);
        mermaidCode += "\n".join(edgeDefinitions);

        return mermaidCode;
    }
}