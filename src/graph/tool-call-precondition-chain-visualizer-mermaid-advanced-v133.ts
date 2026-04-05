import { BaseVisualizer, Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./base-visualizer-mermaid.js";

export class ToolCallPreconditionChainVisualizerMermaidAdvancedV133 extends BaseVisualizer {
    constructor() {
        super();
    }

    visualize(chain: {
        startNodeId: string;
        steps: {
            nodeId: string;
            type: "condition" | "action" | "fallback";
            content: any;
            nextSteps: {
                condition: {
                    label: string;
                    nextNodeId: string;
                    conditionCheck: (data: any) => boolean;
                } | null;
                fallback: {
                    label: string;
                    nextNodeId: string;
                } | null;
                success: {
                    label: string;
                    nextNodeId: string;
                } | null;
            }[];
        };
    }: {
        mermaidGraph: string;
    } {
        const { startNodeId, steps } = chain;
        let mermaidNodes: string[] = [`id: ${startNodeId}, label: "Start Precondition Chain"`, "direction LR"];
        let mermaidEdges: string[] = [];
        const nodeMap: Map<string, { id: string, label: string }> = new Map();

        nodeMap.set(startNodeId, { id: startNodeId, label: "Start" });

        let currentNodeId = startNodeId;

        for (const step of steps) {
            const { nodeId, type, content, nextSteps } = step;
            let nodeLabel = "";

            if (type === "condition") {
                nodeLabel = `Condition: ${content.label}`;
                mermaidNodes.push(`id: ${nodeId}, label: "${nodeLabel}"`);
                nodeMap.set(nodeId, { id: nodeId, label: nodeLabel });
            } else if (type === "action") {
                nodeLabel = `Action: ${content.label}`;
                mermaidNodes.push(`id: ${nodeId}, label: "${nodeLabel}"`);
                nodeMap.set(nodeId, { id: nodeId, label: nodeLabel });
            } else if (type === "fallback") {
                nodeLabel = `Fallback: ${content.label}`;
                mermaidNodes.push(`id: ${nodeId}, label: "${nodeLabel}"`);
                nodeMap.set(nodeId, { id: nodeId, label: nodeLabel });
            }

            if (nextSteps) {
                const currentStepNodeId = nodeId;

                // 1. Success Path (Default/Primary)
                if (nextSteps.success && nextSteps.success.nextNodeId) {
                    const nextSuccessId = nextSteps.success.nextNodeId;
                    if (!nodeMap.has(nextSuccessId)) {
                        mermaidNodes.push(`id: ${nextSuccessId}, label: "${nextSteps.success.label}"`);
                        nodeMap.set(nextSuccessId, { id: nextSuccessId, label: nextSteps.success.label });
                    }
                    mermaidEdges.push(`${currentStepNodeId} -- Success (${nextSteps.success.label}) --> ${nextSuccessId}`);
                }

                // 2. Conditional Branching
                if (nextSteps.condition && nextSteps.condition.nextNodeId) {
                    const nextConditionId = nextSteps.condition.nextNodeId;
                    if (!nodeMap.has(nextConditionId)) {
                        mermaidNodes.push(`id: ${nextConditionId}, label: "${nextSteps.condition.label}"`);
                        nodeMap.set(nextConditionId, { id: nextConditionId, label: nextSteps.condition.label });
                    }
                    mermaidEdges.push(`${currentStepNodeId} -- Condition (${nextSteps.condition.label}) --> ${nextConditionId}`);
                }

                // 3. Fallback Path
                if (nextSteps.fallback && nextSteps.fallback.nextNodeId) {
                    const nextFallbackId = nextSteps.fallback.nextNodeId;
                    if (!nodeMap.has(nextFallbackId)) {
                        mermaidNodes.push(`id: ${nextFallbackId}, label: "${nextSteps.fallback.label}"`);
                        nodeMap.set(nextFallbackId, { id: nextFallbackId, label: nextSteps.fallback.label });
                    }
                    mermaidEdges.push(`${currentStepNodeId} -- Fallback (${nextSteps.fallback.label}) --> ${nextFallbackId}`);
                }
            }
            currentNodeId = nodeId;
        }

        const mermaidGraph = `graph TD;
            ${mermaidNodes.join('\n')}
            ${mermaidEdges.join('\n')}
        `;

        return { mermaidGraph };
    }
}