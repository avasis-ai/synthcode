import { ToolCall } from "./tool-call.js";

export class ToolCallDependencyGraphBuilder {
    private calls: ToolCall[];
    private adjacencyList: Map<ToolCall, Set<ToolCall>>;

    constructor(initialCalls: ToolCall[] = []) {
        this.calls = initialCalls;
        this.adjacencyList = new Map();
        initialCalls.forEach(call => this.adjacencyList.set(call, new Set()));
    }

    addDependency(sourceCall: ToolCall, targetCall: ToolCall): void {
        if (!this.adjacencyList.has(sourceCall) || !this.adjacencyList.has(targetCall)) {
            throw new Error("One or both tool calls are not part of the initial set.");
        }
        this.adjacencyList.get(sourceCall)!.add(targetCall);
    }

    private hasCycleUtil(currentNode: ToolCall, visited: Set<ToolCall>, recursionStack: Set<ToolCall>): boolean {
        visited.add(currentNode);
        recursionStack.add(currentNode);

        const neighbors = this.adjacencyList.get(currentNode) || new Set<ToolCall>();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (this.hasCycleUtil(neighbor, visited, recursionStack)) {
                    return true;
                }
            } else if (recursionStack.has(neighbor)) {
                return true;
            }
        }

        recursionStack.delete(currentNode);
        return false;
    }

    public build(): { nodes: ToolCall[]; edges: [ToolCall, ToolCall][]; } {
        const nodes = this.calls;
        const edges: [ToolCall, ToolCall][] = [];

        for (const [source, targets] of this.adjacencyList.entries()) {
            for (const target of targets) {
                edges.push([source, target]);
            }
        }

        const visited = new Set<ToolCall>();
        const recursionStack = new Set<ToolCall>();

        for (const call of nodes) {
            if (!visited.has(call)) {
                if (this.hasCycleUtil(call, visited, recursionStack)) {
                    throw new Error("Cycle detected in tool call dependencies. Cannot build DAG.");
                }
            }
        }

        return { nodes, edges };
    }
}