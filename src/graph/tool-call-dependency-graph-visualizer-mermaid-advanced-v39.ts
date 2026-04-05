import { DependencyGraph, ToolCallNode, GraphNode, DependencyEdge, GraphEdge } from "./dependency-graph";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV39 {
    private readonly mermaidVersion: string = "v39";

    constructor() {}

    public visualize(graph: DependencyGraph): string {
        if (!graph || !graph.nodes.length) {
            return "graph TD\n    A[\"No nodes found\"]";
        }

        const nodesMap = new Map<string, string>();
        const nodeDefinitions: string[] = [];
        const edgeDefinitions: string[] = [];

        // 1. Process Nodes
        for (const node of graph.nodes) {
            const nodeId = node.id;
            let label = this.formatNodeLabel(node);
            const definition = `${nodeId}["${label}"]`;
            nodeDefinitions.push(definition);
            nodesMap.set(nodeId, definition);
        }

        // 2. Process Edges
        for (const edge of graph.edges) {
            const sourceId = edge.source.id;
            const targetId = edge.target.id;
            const label = this.formatEdgeLabel(edge);
            const definition = `${sourceId} -->|${label}| ${targetId}`;
            edgeDefinitions.push(definition);
        }

        // 3. Assemble Mermaid Graph
        let mermaidString = `graph TD\n`;
        mermaidString += `%% Mermaid Version: ${this.mermaidVersion}\n`;
        mermaidString += `%% Tool Call Dependency Graph Visualization\n`;

        // Add node definitions
        mermaidString += nodeDefinitions.join('\n') + '\n';

        // Add edge definitions
        mermaidString += edgeDefinitions.join('\n');

        return mermaidString;
    }

    private formatNodeLabel(node: GraphNode | ToolCallNode): string {
        if (node.toolCallId) {
            const toolCallNode = node as ToolCallNode;
            const toolName = toolCallNode.toolName || "Unknown Tool";
            const inputSummary = JSON.stringify(toolCallNode.input).substring(0, 30) + (JSON.stringify(toolCallNode.input).length > 30 ? "..." : "");
            return `Tool: ${toolName} | Input: ${inputSummary}`;
        }

        const graphNode = node as GraphNode;
        if (graphNode.type === "user") {
            return `User Input: "${graphNode.content.substring(0, 40)}..."`;
        }
        if (graphNode.type === "assistant") {
            return `Assistant Response (${graphNode.content.length} chars)`;
        }
        if (graphNode.type === "tool_result") {
            return `Tool Result: ${graphNode.content.substring(0, 40)}...`;
        }
        return `Node (${graphNode.type})`;
    }

    private formatEdgeLabel(edge: GraphEdge | DependencyEdge): string {
        if (edge.type === "tool_call") {
            return `Calls ${edge.target.toolName || 'Tool'}`;
        }
        if (edge.type === "dependency") {
            return `Depends On`;
        }
        return `Transition`;
    }
}