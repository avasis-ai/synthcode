import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface DebuggerContext {
    history: Message[];
    currentGraph: Map<string, { dependencies: Set<string>; dependents: Set<string>; toolUse: ToolUseBlock | null }>;
    currentState: Record<string, any>;
}

export interface DebuggerContextFinal extends DebuggerContext {
    finalSnapshots: Map<string, Record<string, any>>;
    executionHistory: {
        step: number;
        context: DebuggerContext;
        action: string;
        result: any;
    }[];
}

export class ToolCallDependencyGraphDebuggerAdvancedV145 {
    private context: DebuggerContextFinal;

    constructor(initialContext: DebuggerContextFinal) {
        this.context = initialContext;
    }

    public getContext(): DebuggerContextFinal {
        return this.context;
    }

    public getGraphStateJson(): string {
        const graphData: Record<string, any> = {};
        this.context.currentGraph.forEach((value, nodeId) => {
            graphData[nodeId] = {
                dependencies: Array.from(value.dependencies),
                dependents: Array.from(value.dependents),
                toolUse: value.toolUse ? {
                    id: value.toolUse.id,
                    name: value.toolUse.name,
                    input: value.toolUse.input
                } : null
            };
        });
        return JSON.stringify(graphData, null, 2);
    }

    public getMermaidGraphSource(): string {
        let mermaid = "graph TD;\n";
        const nodes = Array.from(this.context.currentGraph.keys());

        if (nodes.length === 0) {
            return "graph TD;\n    A[\"No nodes found\"]";
        }

        nodes.forEach(nodeId => {
            const node = this.context.currentGraph.get(nodeId)!;
            let label = `Node ${nodeId}`;
            if (node.toolUse) {
                label = `${node.toolUse.name} (${nodeId})`;
            }
            mermaid += `    ${nodeId}["${label}"]\n`;
        });

        nodes.forEach(nodeId => {
            const node = this.context.currentGraph.get(nodeId)!;
            node.dependencies.forEach(depId => {
                mermaid += `    ${depId} --> ${nodeId} : depends on;\n`;
            });
        });

        return mermaid;
    }

    public stepThrough(stepNumber: number): {
        context: DebuggerContextFinal;
        action: string;
        result: any;
    } | null {
        if (stepNumber < 0 || stepNumber >= this.context.executionHistory.length) {
            return null;
        }
        const historyEntry = this.context.executionHistory[stepNumber];
        return {
            context: historyEntry.context,
            action: historyEntry.action,
            result: historyEntry.result
        };
    }

    public manipulateState(nodeId: string, newState: Record<string, any>): boolean {
        if (!this.context.currentGraph.has(nodeId)) {
            return false;
        }
        this.context.currentState[nodeId] = newState;
        return true;
    }
}