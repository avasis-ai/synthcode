import { ToolCallDependencyGraph, DebuggerContext, Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, LoopEvent } from "./types";

export class DebuggerEngine {
    private graph: ToolCallDependencyGraph;
    private context: DebuggerContext;

    constructor(graph: ToolCallDependencyGraph, context: DebuggerContext) {
        this.graph = graph;
        this.context = context;
    }

    public stepForward(): { success: boolean; result: any } {
        if (!this.context.canStepForward()) {
            return { success: false, result: "Cannot step forward: End of graph reached or no next step defined." };
        }

        const nextNode = this.context.getNextNode();
        if (!nextNode) {
            return { success: false, result: "Cannot step forward: No valid next node found." };
        }

        this.context.updateState(nextNode);
        return { success: true, result: { node: nextNode, state: this.context.getCurrentState() } };
    }

    public stepBackward(): { success: boolean; result: any } {
        if (!this.context.canStepBackward()) {
            return { success: false, result: "Cannot step backward: Already at the starting node." };
        }

        const previousNode = this.context.getPreviousNode();
        if (!previousNode) {
            return { success: false, result: "Cannot step backward: No previous node found." };
        }

        this.context.updateState(previousNode);
        return { success: true, result: { node: previousNode, state: this.context.getCurrentState() } };
    }

    public evaluateNode(nodeId: string): { success: boolean; result: any } {
        const node = this.graph.getNode(nodeId);
        if (!node) {
            return { success: false, result: `Node with ID ${nodeId} not found in the graph.` };
        }

        this.context.updateState(node);
        return { success: true, result: { node: node, state: this.context.getCurrentState() } };
    }

    public getCurrentContextSnapshot(): DebuggerContext {
        return { ...this.context };
    }
}