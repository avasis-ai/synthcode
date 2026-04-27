import { ToolExecutionDependencyGraph } from "./tool-execution-dependency-graph.js";

export class ToolExecutionDependencyBuilder {
    private graph: ToolExecutionDependencyGraph;

    constructor(initialTools: string[]) {
        this.graph = new ToolExecutionDependencyGraph();
        initialTools.forEach(toolName => this.graph.addNode(toolName));
    }

    addSequentialDependency(toolA: string, toolB: string): void {
        this.graph.addDependency(toolA, toolB, "SEQUENTIAL");
    }

    addConditionalDependency(toolA: string, condition: string, toolB: string): void {
        this.graph.addDependency(toolA, toolB, "CONDITIONAL", condition);
    }

    build(): ToolExecutionDependencyGraph {
        return this.graph;
    }
}