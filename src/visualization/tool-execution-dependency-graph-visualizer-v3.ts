import { ToolInvocationRecord } from "./tool-invocation-record";

export class ToolExecutionDependencyGraphVisualizerV3 {
    private records: ToolInvocationRecord[];

    constructor(records: ToolInvocationRecord[]) {
        this.records = records;
    }

    private extractToolCallSequence(records: ToolInvocationRecord[]): { nodes: string[]; edges: { from: string; to: string }[] } {
        const nodes: Set<string> = new Set();
        const edges: { from: string; to: string }[] = [];
        let lastToolName: string | null = null;

        for (const record of records) {
            const toolCall = record.toolCalls.find(tc => tc.type === "call");
            if (toolCall) {
                const toolName = toolCall.toolName;
                nodes.add(toolName);

                if (lastToolName !== null && lastToolName !== toolName) {
                    edges.push({ from: lastToolName, to: toolName });
                }
                lastToolName = toolName;
            }
        }

        return {
            nodes: Array.from(nodes),
            edges: edges
        };
    }

    public visualizeGraph(): { nodes: string[]; edges: { from: string; to: string }[] } {
        return this.extractToolCallSequence(this.records);
    }
}