import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphContext {
    messages: Message[];
    toolCalls: {
        id: string;
        name: string;
        input: Record<string, unknown>;
        isConditional?: boolean;
        condition?: string;
    }[];
    executionFlow?: {
        fromNodeId: string;
        toNodeId: string;
        condition?: string;
        isLoop?: boolean;
    }[];
}

abstract class BaseGraphVisualizer {
    protected context: GraphContext;

    constructor(context: GraphContext) {
        this.context = context;
    }

    abstract visualize(): string;
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV2 extends BaseGraphVisualizer {
    constructor(context: GraphContext) {
        super(context);
    }

    private getNodeId(messageIndex: number, blockType: string, uniqueId: string): string {
        return `N${messageIndex}-${blockType.toUpperCase()}-${uniqueId.substring(0, 4).toUpperCase()}`;
    }

    private getBlockLabel(block: ContentBlock): string {
        if (block.type === "text") {
            return block.text.substring(0, 30) + (block.text.length > 30 ? "..." : "");
        }
        if (block.type === "tool_use") {
            return `${block.name} (Input: ${JSON.stringify(block.input).substring(0, 15)}...)`;
        }
        if (block.type === "thinking") {
            return `Thinking: ${block.thinking.substring(0, 20)}...`;
        }
        return "Unknown Block";
    }

    private generateNodes(): string[] {
        const nodes: string[] = [];
        let messageIndex = 0;

        for (const message of this.context.messages) {
            if (message.role === "user" && message.content instanceof TextBlock) {
                const nodeId = this.getNodeId(messageIndex++, "user", "U");
                nodes.push(`    ${nodeId}["User Input: ${message.content.text.substring(0, 20)}..."]`);
            } else if (message.role === "assistant" && message.content instanceof ContentBlock[]) {
                let blockIndex = 0;
                for (const block of message.content) {
                    let nodeId: string;
                    if (block.type === "text") {
                        nodeId = this.getNodeId(messageIndex++, "text", "A");
                        nodes.push(`    ${nodeId}["Text: ${this.getBlockLabel(block)}"]`);
                    } else if (block.type === "tool_use") {
                        const toolCall = this.context.toolCalls.find(tc => tc.id === block.id);
                        if (toolCall) {
                            nodeId = this.getNodeId(messageIndex++, "tool_use", "T");
                            nodes.push(`    ${nodeId}["Tool Call: ${block.name} (ID: ${block.id.substring(0, 4)}...)"]`);
                        }
                    } else if (block.type === "thinking") {
                        nodeId = this.getNodeId(messageIndex++, "thinking", "TH");
                        nodes.push(`    ${nodeId}["Thinking Process: ${this.getBlockLabel(block)}"]`);
                    }
                    blockIndex++;
                }
            }
        }
        return nodes;
    }

    private generateEdges(): string[] {
        const edges: string[] = [];
        const { executionFlow } = this.context;

        if (executionFlow) {
            for (const flow of executionFlow) {
                let edgeType = "-->";
                let label = "";
                let style = "";

                if (flow.isLoop) {
                    edgeType = "-->";
                    label = "Loop";
                    style = "style ${flow.fromNodeId} fill:#ffdddd,stroke:#f00";
                    style += " style ${flow.toNodeId} fill:#ffdddd,stroke:#f00";
                } else if (flow.condition) {
                    edgeType = "-->";
                    label = `[Condition: ${flow.condition}]`;
                    style = "style ${flow.fromNodeId} fill:#ddffdd,stroke:#0a0";
                    style += " style ${flow.toNodeId} fill:#ddffdd,stroke:#0a0";
                } else {
                    edgeType = "-->";
                }

                edges.push(`    ${flow.fromNodeId} ${edgeType} ${flow.toNodeId} ${label}`);
                if (style) {
                    edges.push(`    ${style}`);
                }
            }
        }
        return edges;
    }

    public visualize(): string {
        const nodeDeclarations = this.generateNodes();
        const edgeDeclarations = this.generateEdges();

        let mermaidString = "graph TD\n";
        mermaidString += "    %% --- Nodes --- ---\n";
        mermaidString += nodeDeclarations.join("\n");
        mermaidString += "\n\n";

        mermaidString += "    %% --- Edges & Flow --- ---\n";
        mermaidString += edgeDeclarations.join("\n");

        return mermaidString;
    }
}

export { ToolCallDependencyGraphVisualizerMermaidAdvancedV2 };