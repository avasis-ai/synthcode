import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface DependencyGraph {
    messages: Message[];
    dependencies: {
        sourceId: string;
        targetId: string;
        type: "call" | "response" | "dependency";
        metadata?: Record<string, any>;
    }[];
}

interface AdvancedStyleOptions {
    defaultNodeStyle?: string;
    toolUseNodeStyle?: string;
    thinkingNodeStyle?: string;
    errorEdgeStyle?: string;
    successEdgeStyle?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV105 {
    private graph: DependencyGraph;
    private options: AdvancedStyleOptions;

    constructor(graph: DependencyGraph, options: AdvancedStyleOptions = {}) {
        this.graph = graph;
        this.options = {
            defaultNodeStyle: "style fill:#eee,stroke:#333,stroke-width:2px",
            toolUseNodeStyle: "style fill:#ccf,stroke:#66c,stroke-width:2px",
            thinkingNodeStyle: "style fill:#ffc,stroke:#aa0,stroke-width:2px",
            errorEdgeStyle: "style stroke:red,stroke-width:3px",
            successEdgeStyle: "style stroke:green,stroke-width:3px",
            ...options
        };
    }

    private getNodeStyle(message: Message): string {
        if (message.role === "assistant") {
            const blocks = message.content;
            if (blocks.some(block => block.type === "tool_use")) {
                return this.options.toolUseNodeStyle || "style fill:#ccf,stroke:#66c,stroke-width:2px";
            }
            if (blocks.some(block => block.type === "thinking")) {
                return this.options.thinkingNodeStyle || "style fill:#ffc,stroke:#aa0,stroke-width:2px";
            }
        }
        return this.options.defaultNodeStyle || "style fill:#eee,stroke:#333,stroke-width:2px";
    }

    private getEdgeStyle(dependency: {
        sourceId: string;
        targetId: string;
        type: "call" | "response" | "dependency";
        metadata?: Record<string, any>;
    }): string {
        if (dependency.type === "dependency" && dependency.metadata?.is_error) {
            return this.options.errorEdgeStyle || "style stroke:red,stroke-width:3px";
        }
        if (dependency.type === "response") {
            return this.options.successEdgeStyle || "style stroke:green,stroke-width:3px";
        }
        return "";
    }

    public renderMermaidSyntax(): string {
        let mermaid = "graph TD;\n";
        let nodeDefinitions: Record<string, string> = {};
        let edgeDefinitions: string[] = [];

        // 1. Define Nodes
        this.graph.messages.forEach((message, index) => {
            const nodeId = `M${index}`;
            let label = "";

            if (message.role === "user") {
                label = `User Input: "${message.content.substring(0, 30)}..."`;
            } else if (message.role === "assistant") {
                const toolUses = (message.content as ContentBlock[]).filter(b => b.type === "tool_use");
                if (toolUses.length > 0) {
                    label = `Assistant (Tools: ${toolUses.length})`;
                } else if (message.content.some(b => b.type === "thinking")) {
                    label = `Assistant (Thinking)`;
                } else {
                    label = `Assistant Response`;
                }
            } else if (message.role === "tool") {
                label = `Tool Result (${message.tool_use_id})`;
            }

            nodeDefinitions[nodeId] = `${nodeId}["${label}"]${this.getNodeStyle(message)}`;
        });

        // 2. Define Edges
        this.graph.dependencies.forEach(dep => {
            const sourceNode = `M${dep.sourceId.split("M")[1]}`;
            const targetNode = `M${dep.targetId.split("M")[1]}`;
            const edgeStyle = this.getEdgeStyle(dep);
            
            let edgeLabel = "";
            if (dep.type === "call") {
                edgeLabel = "Calls";
            } else if (dep.type === "response") {
                edgeLabel = "Responds To";
            } else if (dep.type === "dependency") {
                edgeLabel = "Depends On";
            }

            edgeDefinitions.push(`${sourceNode} -- "${edgeLabel}" ${edgeStyle} --> ${targetNode}`);
        });

        // 3. Assemble final graph
        let nodeBlock = Object.values(nodeDefinitions).join('\n');
        let edgeBlock = edgeDefinitions.join('\n');

        mermaid += "\n%% Nodes\n" + nodeBlock + "\n\n%% Edges\n" + edgeBlock + "\n";

        return mermaid;
    }
}