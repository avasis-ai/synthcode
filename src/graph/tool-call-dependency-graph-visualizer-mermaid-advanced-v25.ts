import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV25 {
    private advancedConfig: {
        defaultNodeStyle: string;
        conditionalEdgeSyntax: string;
        layoutEngine: "dagre" | "graphviz";
    };

    constructor(config: {
        defaultNodeStyle: string;
        conditionalEdgeSyntax: string;
        layoutEngine: "dagre" | "graphviz";
    } = {
        defaultNodeStyle: "style fill:#f9f,stroke:#333,stroke-width:2px",
        conditionalEdgeSyntax: "-->{condition}",
        layoutEngine: "dagre"
    }) {
        this.advancedConfig = config;
    }

    private getNodeId(message: Message, index: number): string {
        const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
        return `${rolePrefix}_${Math.min(index, 99)}`;
    }

    private generateNodeSyntax(message: Message, nodeId: string): string {
        let content = "";
        if (message.role === "user") {
            content = `User Input: "${message.content.substring(0, 30)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = (message as any).content?.filter((block: ContentBlock) => block.type === "tool_use") || [];
            if (toolUses.length > 0) {
                content = `Assistant Action: ${toolUses.map(t => t.name).join(", ")}`;
            } else {
                content = `Response: "${(message as any).content[0]?.text?.text.substring(0, 30) || 'Text content'}..."`;
            }
        } else if (message.role === "tool") {
            content = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        }

        return `node_${nodeId}["${content}"]${this.advancedConfig.defaultNodeStyle}`;
    }

    private generateEdgeSyntax(sourceId: string, targetId: string, condition?: string): string {
        let edge = `${sourceId} --> ${targetId}`;
        if (condition) {
            edge = `${sourceId} ${this.advancedConfig.conditionalEdgeSyntax.replace("{condition}", `"${condition}"`)} ${targetId}`;
        }
        return edge;
    }

    public visualize(messages: Message[], advancedOptions?: {
        defaultNodeStyle?: string;
        conditionalEdgeSyntax?: string;
        layoutEngine?: "dagre" | "graphviz";
    }): string {
        const config = {
            defaultNodeStyle: advancedOptions?.defaultNodeStyle || this.advancedConfig.defaultNodeStyle,
            conditionalEdgeSyntax: advancedOptions?.conditionalEdgeSyntax || this.advancedConfig.conditionalEdgeSyntax,
            layoutEngine: advancedOptions?.layoutEngine || this.advancedConfig.layoutEngine
        };

        let graphDefinition = `graph ${config.layoutEngine} {`;
        let nodeDeclarations: string[] = [];
        let edgeDeclarations: string[] = [];

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const nodeId = this.getNodeId(message, i);
            nodeDeclarations.push(this.generateNodeSyntax(message, nodeId));

            if (i > 0) {
                const previousMessage = messages[i - 1];
                let condition: string | undefined = undefined;

                if (message.role === "tool" && previousMessage.role === "assistant") {
                    condition = "Tool Call Successful";
                } else if (message.role === "user" && previousMessage.role === "assistant") {
                    condition = "User Follow-up";
                }

                edgeDeclarations.push(this.generateEdgeSyntax(
                    this.getNodeId(previousMessage, i - 1),
                    nodeId,
                    condition
                ));
            }
        }

        graphDefinition += nodeDeclarations.join('\n') + "\n";
        graphDefinition += edgeDeclarations.join('\n');
        graphDefinition += "\n}";

        return graphDefinition;
    }

    public static generateExampleGraph(): string {
        const exampleMessages: Message[] = [
            { role: "user", content: "What is the capital of France?" },
            { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "search_api", input: { query: "capital of France" } }] },
            { role: "tool", tool_use_id: "t1", content: "Paris, France.", is_error: false },
            { role: "assistant", content: [{ type: "text", text: "The capital is Paris." }] },
            { role: "user", content: "And what about Germany?" }
        ];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV25();
        return visualizer.visualize(exampleMessages);
    }
}