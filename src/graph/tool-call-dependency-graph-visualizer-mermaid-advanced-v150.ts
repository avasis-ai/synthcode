import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV150 {
    private graphContext: {
        messages: Message[];
        toolCalls: {
            id: string;
            name: string;
            input: Record<string, unknown>;
        }[];
        flowControl: {
            type: "if" | "loop" | "switch";
            condition: string;
            branches: {
                condition: string;
                nextNodes: string[];
            }[];
        }[];
    };

    constructor(graphContext: {
        messages: Message[];
        toolCalls: {
            id: string;
            name: string;
            input: Record<string, unknown>;
        }[];
        flowControl: {
            type: "if" | "loop" | "switch";
            condition: string;
            branches: {
                condition: string;
                nextNodes: string[];
            }[];
        }[];
    }) {
        this.graphContext = graphContext;
    }

    private generateNodeId(prefix: string, index: number): string {
        return `${prefix}-${index}`;
    }

    private generateMessageNode(message: Message, index: number): { id: string; label: string } {
        const id = this.generateNodeId("msg", index);
        let label = "";

        if (message.role === "user") {
            label = `User Input: "${message.content.substring(0, 30)}..."`;
        } else if (message.role === "assistant") {
            const toolUses = (message as AssistantMessage).content.filter((block): block is ToolUseBlock => block.type === "tool_use");
            if (toolUses.length > 0) {
                label = `Assistant: Calls ${toolUses.length} Tools`;
            } else {
                label = `Assistant Response: "${message.content.filter((block): block is TextBlock => block.type === "text" && block.text).map(b => b.text).join('').substring(0, 30)}..."`;
            }
        } else if (message.role === "tool") {
            label = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        }

        return { id, label };
    }

    private generateToolCallNode(toolCall: { id: string; name: string; input: Record<string, unknown> }, index: number): { id: string; label: string } {
        const id = this.generateNodeId("tool", index);
        return {
            id,
            label: `Tool Call: ${toolCall.name}(${JSON.stringify(toolCall.input)})`
        };
    }

    private generateFlowControlNode(index: number, type: "if" | "loop" | "switch", condition: string): { id: string; label: string } {
        const id = this.generateNodeId("flow", index);
        let label = "";
        if (type === "if") {
            label = `IF ${condition}`;
        } else if (type === "loop") {
            label = `LOOP ${condition}`;
        } else {
            label = `SWITCH ${condition}`;
        }
        return { id, label };
    }

    private buildMermaidGraph(): string {
        let mermaid = "graph TD;\n";
        let nodeIdCounter = 0;

        // 1. Process Messages (User/Assistant/Tool Result)
        const msgNodes: { id: string; label: string }[] = this.graphContext.messages.map((msg, index) => {
            return this.generateMessageNode(msg, index);
        });

        // 2. Process Tool Calls
        const toolNodes: { id: string; label: string }[] = this.graphContext.toolCalls.map((tc, index) => {
            return this.generateToolCallNode(tc, index);
        });

        // 3. Process Flow Control
        const flowNodes: { id: string; label: string }[] = this.graphContext.flowControl.map((fc, index) => {
            return this.generateFlowControlNode(index, fc.type, fc.condition);
        });

        // Add all nodes to Mermaid string
        [...msgNodes, ...toolNodes, ...flowNodes].forEach(node => {
            mermaid += `${node.id}["${node.label}"]\n`;
        });

        // 4. Build Edges (Simplified connection logic for demonstration)
        // Connect User -> Initial Assistant Step
        if (msgNodes.length > 0) {
            mermaid += `${msgNodes[0].id} -->|Start| ${toolNodes[0]?.id || msgNodes[1]?.id || 'StartNode'};\n`;
        }

        // Connect Tool Calls to subsequent steps
        toolNodes.forEach((node, index) => {
            const nextMsgId = msgNodes[index + 1]?.id;
            if (nextMsgId) {
                mermaid += `${node.id} -->|Result| ${nextMsgId};\n`;
            }
        });

        // Connect Flow Control (Highly simplified: assume flow control dictates the next major step)
        flowNodes.forEach((node, index) => {
            const nextNodeId = msgNodes[index + 2]?.id || toolNodes[index + 1]?.id || '';
            if (nextNodeId) {
                mermaid += `${node.id} -->|Control Flow| ${nextNodeId};\n`;
            }
        });

        // Add a start node for completeness
        mermaid += "StartNode[\"Start Execution\"]";

        return mermaid;
    }

    public renderMermaidGraph(): string {
        return this.buildMermaidGraph();
    }
}