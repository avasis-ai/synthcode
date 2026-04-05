import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final {
    private messages: Message[];
    private graphDefinition: string = "graph TD\n";
    private nodeMap: Map<string, string> = new Map();
    private nodeIdCounter: number = 0;

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private generateUniqueId(): string {
        return `node_${this.nodeIdCounter++}`;
    }

    private getNodeLabel(id: string, title: string): string {
        return `${id}["${title}"]`;
    }

    private processMessage(message: Message): { nodeId: string, mermaidContent: string } | null {
        let currentId = this.generateUniqueId();
        let mermaidContent = "";
        let title = "";

        if (message.role === "user") {
            title = `User Input`;
            mermaidContent = `A${currentId} -->|Input| ${currentId}`;
        } else if (message.role === "assistant") {
            title = `Assistant Response`;
            let blocks: ContentBlock[] = (message as any).content || [];
            let blockDescriptions: string[] = [];

            for (const block of blocks) {
                if (block.type === "text") {
                    blockDescriptions.push(`Text: ${block.text.substring(0, 30)}...`);
                } else if (block.type === "tool_use") {
                    blockDescriptions.push(`Tool Call: ${block.name}`);
                } else if (block.type === "thinking") {
                    blockDescriptions.push(`Thinking: ${block.thinking.substring(0, 30)}...`);
                }
            }
            title = `Assistant (${blockDescriptions.join(" | ")})`;
            mermaidContent = `A${currentId} -->|Response| ${currentId}`;
        } else if (message.role === "tool") {
            title = `Tool Result: ${message.tool_use_id}`;
            mermaidContent = `A${currentId} -->|Result| ${currentId}`;
        } else {
            return null;
        }

        const nodeDefinition = this.getNodeLabel(currentId, title);
        this.graphDefinition += `${nodeDefinition}\n`;
        return { nodeId: currentId, mermaidContent: mermaidContent };
    }

    private processToolUse(toolUse: ToolUseBlock, sourceNodeId: string): { nodeId: string, mermaidContent: string } | null {
        const toolId = `tool_${toolUse.id}`;
        let targetNodeId = this.generateUniqueId();
        let title = `Tool Call: ${toolUse.name}`;

        this.graphDefinition += `${this.getNodeLabel(toolId, title)}\n`;
        this.graphDefinition += `${sourceNodeId} -->|Calls| ${toolId}\n`;

        const resultNodeDefinition = this.getNodeLabel(targetNodeId, `Tool Output (${toolUse.name})`);
        this.graphDefinition += `${resultNodeDefinition}\n`;
        this.graphDefinition += `${toolId} -->|Output| ${targetNodeId}\n`;

        return { nodeId: targetNodeId, mermaidContent: `${sourceNodeId} -->|Calls| ${toolId} -->|Output| ${targetNodeId}` };
    }

    private processFlowControl(
        sourceNodeId: string,
        context: {
            type: "conditional" | "loop";
            condition: string;
            branches: { targetId: string; label: string }[];
        }
    ): string {
        let flowMermaid = "";
        let branchNodes: string[] = [];

        if (context.type === "conditional") {
            const conditionId = this.generateUniqueId();
            this.graphDefinition += `${this.getNodeLabel(conditionId, "Conditional Branch")}\n`;
            this.graphDefinition += `${sourceNodeId} -->|Check| ${conditionId}\n`;

            for (const branch of context.branches) {
                const branchNodeId = this.generateUniqueId();
                this.graphDefinition += `${this.getNodeLabel(branchNodeId, branch.label)}\n`;
                flowMermaid += `${conditionId} -->|${branch.label}| ${branchNodeId}\n`;
                branchNodes.push(branchNodeId);
            }
        } else if (context.type === "loop") {
            const loopStartId = this.generateUniqueId();
            this.graphDefinition += `${this.getNodeLabel(loopStartId, "Loop Start")}\n`;
            this.graphDefinition += `${sourceNodeId} -->|Enter Loop| ${loopStartId}\n`;

            // Assuming the loop structure connects back to itself or a subsequent step
            const loopExitId = this.generateUniqueId();
            this.graphDefinition += `${this.getNodeLabel(loopExitId, "Loop End")}\n`;
            flowMermaid += `${loopStartId} -->|Continue| ${loopStartId}\n`; // Self-loop visualization
            flowMermaid += `${loopStartId} -->|Exit| ${loopExitId}\n`;
            branchNodes.push(loopStartId, loopExitId);
        }

        return flowMermaid;
    }

    public visualize(flowContext?: {
        flowControlNodes: {
            type: "conditional" | "loop";
            condition: string;
            branches: { targetId: string; label: string }[];
        }[];
    }): string {
        this.graphDefinition = "graph TD\n";
        this.nodeMap.clear();
        this.nodeIdCounter = 0;

        let lastNodeId: string | null = null;

        for (const message of this.messages) {
            if (message.role === "user") {
                const result = this.processMessage(message);
                if (result) {
                    lastNodeId = result.nodeId;
                }
            } else if (message.role === "assistant") {
                const result = this.processMessage(message);
                if (result) {
                    lastNodeId = result.nodeId;
                }
            } else if (message.role === "tool") {
                // Tool results usually follow a tool call, handled implicitly or by flow context
                if (lastNodeId) {
                    // Placeholder for tool result processing if not covered by flow context
                    const toolResultMessage = message as any;
                    const toolId = `tool_result_${toolResultMessage.tool_use_id}`;
                    this.graphDefinition += `${this.getNodeLabel(toolId, `Tool Result: ${toolResultMessage.tool_use_id}`)}\n`;
                    this.graphDefinition += `${lastNodeId} -->|Result| ${toolId}\n`;
                    lastNodeId = toolId;
                }
            }
        }

        if (flowContext && flowContext.length > 0) {
            for (const context of flowContext) {
                if (lastNodeId) {
                    const flowMermaid = this.processFlowControl(lastNodeId, context);
                    this.graphDefinition += flowMermaid + "\n";
                    // Update lastNodeId to the exit point of the flow control for subsequent steps
                    lastNodeId = context.type === "conditional" ? context.branches[0].targetId : "node_after_flow";
                }
            }
        }

        return this.graphDefinition;
    }
}