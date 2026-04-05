import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphNode {
    id: string;
    type: "user_input" | "tool_call" | "agent_thought";
    data: any;
}

interface GraphEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    relationship: "calls" | "follows";
}

interface GraphState {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;
    currentNodeId: string | null;
    currentEdgeId: string | null;
    history: Array<{ nodeId: string, edgeId: string | null, action: "step_into" | "step_over" }>;
}

export interface DebuggerContext {
    graphState: GraphState;
    messageHistory: Message[];
    setFocusNode: (nodeId: string) => void;
    setFocusEdge: (edgeId: string) => void;
}

export interface ToolCallDependencyGraphDebuggerContext extends DebuggerContext {
    /**
     * Gets the node currently in focus for inspection.
     */
    getFocusNode(): GraphNode | undefined;

    /**
     * Gets the edge currently in focus for inspection.
     */
    getFocusEdge(): GraphEdge | undefined;

    /**
     * Advances the debugger state by stepping into a specific node.
     * @param nodeId The ID of the node to step into.
     * @returns A promise that resolves when the state transition is complete.
     */
    stepIntoNode(nodeId: string): Promise<void>;

    /**
     * Advances the debugger state by stepping over a specific edge.
     * @param edgeId The ID of the edge to step over.
     * @returns A promise that resolves when the state transition is complete.
     */
    stepOverEdge(edgeId: string): Promise<void>;

    /**
     * Clears the current focus and resets the debugger view.
     */
    resetFocus(): void;
}

class GraphDebuggerEngine {
    private context: ToolCallDependencyGraphDebuggerContext;

    constructor(initialContext: ToolCallDependencyGraphDebuggerContext) {
        this.context = initialContext;
    }

    public getContext(): ToolCallDependencyGraphDebuggerContext {
        return this.context;
    }

    public async debugStep(action: "step_into" | "step_over", identifier: string): Promise<void> {
        if (action === "step_into") {
            return this.context.stepIntoNode(identifier);
        } else if (action === "step_over") {
            return this.context.stepOverEdge(identifier);
        }
        throw new Error("Invalid debug action.");
    }
}

export { ToolCallDependencyGraphDebuggerContext, GraphDebuggerEngine };