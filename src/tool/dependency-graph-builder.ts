import { ToolExecutionRecord } from "./types";

export class DependencyGraph {
    private nodes: Map<string, { name: string; inputs: Set<string>; outputs: Set<string> }>;
    private adjacencyList: Map<string, Set<string>>;

    constructor(records: ToolExecutionRecord[]) {
        this.nodes = new Map();
        this.adjacencyList = new Map();

        this.buildGraph(records);
    }

    private getNode(toolId: string, name: string): { name: string; inputs: Set<string>; outputs: Set<string> } {
        if (!this.nodes.has(toolId)) {
            this.nodes.set(toolId, { name: name, inputs: new Set(), outputs: new Set() });
            this.adjacencyList.set(toolId, new Set());
        }
        return this.nodes.get(toolId)!;
    }

    private buildGraph(records: ToolExecutionRecord[]): void {
        const toolOutputs = new Map<string, string>();

        for (const record of records) {
            const toolId = record.tool_use_id;
            const toolName = record.tool_name || "UnknownTool";

            if (!this.nodes.has(toolId)) {
                this.getNode(toolId, toolName);
            }

            // Simulate output capture for dependency tracking
            if (record.content) {
                toolOutputs.set(toolId, record.content);
            }

            // In a real scenario, we would parse the 'inputs' from the record
            // to see which previous tool outputs were consumed.
            // For this simulation, we assume the record itself implies the usage.
            // We'll just mark the tool as having an output.
            this.getNode(toolId, toolName).outputs.add("output_data");
        }

        // Second pass: Simulate dependency creation based on sequential flow
        // A more complex implementation would require explicit input mapping.
        for (let i = 0; i < records.length - 1; i++) {
            const currentRecord = records[i];
            const nextRecord = records[i + 1];

            const currentToolId = currentRecord.tool_use_id;
            const nextToolId = nextRecord.tool_use_id;

            // Heuristic: If the next tool's input seems related to the current tool's output
            // (This is a simplification for the exercise structure)
            if (currentRecord.content && nextRecord.tool_name) {
                this.addEdge(currentToolId, nextToolId, "data_flow");
            }
        }
    }

    private addEdge(sourceId: string, targetId: string, dataKey: string): void {
        const sourceNode = this.getNode(sourceId, "Source");
        const targetNode = this.getNode(targetId, "Target");

        if (!this.adjacencyList.has(sourceId)) {
            this.adjacencyList.set(sourceId, new Set());
        }
        this.adjacencyList.get(sourceId)!.add(targetId);
    }

    public getNodes(): Map<string, { name: string; inputs: Set<string>; outputs: Set<string> }> {
        return this.nodes;
    }

    public getAdjacencyList(): Map<string, Set<string>> {
        return this.adjacencyList;
    }

    public serializeToDot(): string {
        let dot = "digraph DependencyGraph {\n";
        dot += "    rankdir=LR;\n";
        dot += "    node [shape=box];\n\n";

        // Define nodes
        for (const [id, node] of this.nodes.entries()) {
            dot += `    "${id}" [label="${node.name}\\n(Inputs: ${Array.from(node.inputs).join(", ")})\\n(Outputs: ${Array.from(node.outputs).join(", ")})"];\n`;
        }

        // Define edges
        for (const [source, targets] of this.adjacencyList.entries()) {
            for (const target of targets) {
                dot += `    "${source}" -> "${target}";\n`;
            }
        }

        dot += "}\n";
        return dot;
    }
}