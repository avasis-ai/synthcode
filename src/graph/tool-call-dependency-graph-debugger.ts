import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class DebuggerContext {
    private history: Message[] = [];
    private graphNodes: Map<string, any> = new Map();
    private graphEdges: Map<string, any> = new Map();

    constructor(initialHistory: Message[], initialGraphNodes: Map<string, any>, initialGraphEdges: Map<string, any>) {
        this.history = [...initialHistory];
        this.graphNodes = initialGraphNodes;
        this.graphEdges = initialGraphEdges;
    }

    getHistory(): Message[] {
        return [...this.history];
    }

    getGraphNodes(): Map<string, any> {
        return new Map(this.graphNodes);
    }

    getGraphEdges(): Map<string, any> {
        return new Map(this.graphEdges);
    }

    addHistory(message: Message): void {
        this.history.push(message);
    }

    addNode(id: string, nodeData: any): void {
        this.graphNodes.set(id, nodeData);
    }

    addEdge(sourceId: string, targetId: string, edgeData: any): void {
        this.graphEdges.set(`${sourceId}->${targetId}`, edgeData);
    }

    /**
     * Simulates stepping through the execution graph, yielding detailed state at each step.
     * @param startNodeId The ID of the node to start debugging from.
     * @returns An async generator yielding detailed state objects for inspection.
     */
    async *stepExecution(startNodeId: string): AsyncGenerator<{
        step: number;
        currentNodeId: string;
        edgeDetails?: any;
        state: {
            history: Message[];
            nodes: Map<string, any>;
            edges: Map<string, any>;
        };
    }> {
        let step = 0;
        let currentNodeId = startNodeId;

        while (currentNodeId) {
            step++;
            const node = this.graphNodes.get(currentNodeId);

            yield {
                step: step,
                currentNodeId: currentNodeId,
                edgeDetails: undefined,
                state: {
                    history: this.getHistory(),
                    nodes: this.getGraphNodes(),
                    edges: this.getGraphEdges(),
                }
            };

            // Simulate processing the node logic
            await new Promise(resolve => setTimeout(resolve, 10));

            // In a real scenario, this would traverse edges based on node output
            const nextEdgeKey = `${currentNodeId}->next`; // Placeholder logic
            const edge = this.graphEdges.get(nextEdgeKey);

            if (edge) {
                yield {
                    step: step,
                    currentNodeId: currentNodeId,
                    edgeDetails: edge,
                    state: {
                        history: this.getHistory(),
                        nodes: this.getGraphNodes(),
                        edges: this.getGraphEdges(),
                    }
                };
                currentNodeId = edge.targetId;
            } else {
                currentNodeId = null;
            }
        }
    }
}

export class ToolCallDependencyGraphDebugger {
    private context: DebuggerContext;

    constructor(initialHistory: Message[], initialNodes: Map<string, any>, initialEdges: Map<string, any>) {
        this.context = new DebuggerContext(initialHistory, initialNodes, initialEdges);
    }

    /**
     * Initializes the debugger with the current state and graph structure.
     * @param initialHistory The message history leading up to the graph.
     * @param nodes Map of node IDs to node data.
     * @param edges Map of edge keys to edge data.
     * @returns A new instance of the debugger.
     */
    static create(initialHistory: Message[], nodes: Map<string, any>, edges: Map<string, any>): ToolCallDependencyGraphDebugger {
        return new ToolCallDependencyGraphDebugger(initialHistory, nodes, edges);
    }

    /**
     * Executes the step-by-step debugging process.
     * @param startNodeId The starting point in the graph.
     * @returns An async generator yielding detailed state snapshots.
     */
    async debug(startNodeId: string): AsyncGenerator<{
        step: number;
        currentNodeId: string;
        edgeDetails?: any;
        state: {
            history: Message[];
            nodes: Map<string, any>;
            edges: Map<string, any>;
        };
    }> {
        return this.context.stepExecution(startNodeId);
    }

    /**
     * Provides a structured view of the current state for visualization consumption.
     * @returns An object containing all necessary graph components.
     */
    getCurrentStateSnapshot(): {
        history: Message[];
        nodes: Map<string, any>;
        edges: Map<string, any>;
    } {
        return {
            history: this.context.getHistory(),
            nodes: this.context.getGraphNodes(),
            edges: this.context.getGraphEdges(),
        };
    }
}