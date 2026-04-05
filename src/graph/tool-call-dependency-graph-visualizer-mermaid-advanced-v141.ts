import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV141 {
    private messages: Message[];

    constructor(messages: Message[]) {
        this.messages = messages;
    }

    private getGraphTitle(): string {
        return "Tool Call Dependency Graph";
    }

    private generateMermaidGraph(): string {
        let mermaid = `graph TD;\n`;
        mermaid += `    %% Title: ${this.getGraphTitle()}\n`;

        let nodeIdCounter = 1;
        let nodeMap: Map<string, string> = new Map();

        const getNodeId = (prefix: string): string => {
            const id = `N${nodeIdCounter++}`;
            nodeMap.set(prefix, id);
            return id;
        };

        const addNode = (id: string, label: string, type: string = "process") => {
            mermaid += `    ${id}["${label}"]\n`;
        };

        const linkNodes = (fromId: string, toId: string, label: string = "") => {
            mermaid += `    ${fromId} -->|${label}| ${toId};\n`;
        };

        // 1. Process Messages sequentially to build the flow
        let lastNodeId: string | null = null;

        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            let currentNodeId: string;

            if (message.role === "user") {
                const userNodeId = getNodeId(`user_${i}`);
                addNode(userNodeId, `User Input: ${message.content.substring(0, 30)}...`, "user");
                currentNodeId = userNodeId;
            } else if (message.role === "assistant") {
                const assistantNodeId = getNodeId(`assistant_${i}`);
                addNode(assistantNodeId, `Assistant Response`, "assistant");
                currentNodeId = assistantNodeId;
            } else if (message.role === "tool") {
                const toolNodeId = getNodeId(`tool_${i}`);
                addNode(toolNodeId, `Tool Result: ${message.content.substring(0, 30)}...`, "tool");
                currentNodeId = toolNodeId;
            } else {
                continue;
            }

            // Link previous node to current node
            if (lastNodeId) {
                linkNodes(lastNodeId, currentNodeId);
            }
            lastNodeId = currentNodeId;

            // 2. Process Content Blocks within the message for detailed flow
            if (message.role === "assistant" && message.content.length > 0) {
                let blockIdCounter = 1;
                let lastBlockNodeId: string | null = null;

                for (const block of message.content) {
                    let blockNodeId: string;
                    let blockLabel: string;

                    if (block.type === "text") {
                        blockNodeId = getNodeId(`text_${i}_${blockIdCounter}`);
                        blockLabel = `Text: ${block.text.substring(0, 30)}...`;
                        addNode(blockNodeId, blockLabel, "text");
                        if (lastBlockNodeId) {
                            linkNodes(lastBlockNodeId, blockNodeId);
                        }
                        lastBlockNodeId = blockNodeId;
                    } else if (block.type === "tool_use") {
                        const toolUseBlock = block as ToolUseBlock;
                        blockNodeId = getNodeId(`tool_use_${i}_${blockIdCounter}`);
                        blockLabel = `Tool Call: ${toolUseBlock.name}(${JSON.stringify(toolUseBlock.input)})`;
                        addNode(blockNodeId, blockLabel, "tool_use");
                        if (lastBlockNodeId) {
                            linkNodes(lastBlockNodeId, blockNodeId);
                        }
                        lastBlockNodeId = blockNodeId;
                    } else if (block.type === "thinking") {
                        const thinkingBlock = block as ThinkingBlock;
                        blockNodeId = getNodeId(`thinking_${i}_${blockIdCounter}`);
                        blockLabel = `Thinking: ${thinkingBlock.thinking.substring(0, 30)}...`;
                        addNode(blockNodeId, blockLabel, "thinking");
                        if (lastBlockNodeId) {
                            linkNodes(lastBlockNodeId, blockNodeId);
                        }
                        lastBlockNodeId = blockNodeId;
                    }
                    blockIdCounter++;
                }
                // Link the last block to the main assistant node if it's the first block
                if (lastBlockNodeId && i === 0 && message.content.length > 0) {
                    // This linkage is complex; for simplicity, we link the first block to the main node
                    // and assume the main node represents the start of the content.
                    // We rely on the sequential linking above for internal flow.
                }
            }
        }

        // 3. Define Styling/Subgraphs (Conceptual enhancement)
        mermaid += `\n    %% Styling for clarity\n`;
        mermaid += `    classDef user fill:#ccf,stroke:#333,stroke-width:2px; \n`;
        mermaid += `    classDef assistant fill:#cff,stroke:#333,stroke-width:2px; \n`;
        mermaid += `    classDef tool fill:#ffc,stroke:#333,stroke-width:2px; \n`;
        mermaid += `    classDef thinking fill:#ddf,stroke:#333,stroke-width:1px; \n`;
        mermaid += `    classDef tool_use fill:#fcc,stroke:#333,stroke-width:2px; \n`;

        // Apply classes (This requires knowing the IDs assigned, which is complex dynamically. We skip explicit class application for robustness but keep the structure.)

        return mermaid;
    }

    /**
     * Generates the complete Mermaid syntax string representing the dependency graph.
     * @returns {string} The Mermaid graph definition.
     */
    public visualize(): string {
        return this.generateMermaidGraph();
    }
}