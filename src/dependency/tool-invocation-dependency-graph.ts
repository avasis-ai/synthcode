import { ToolInvocationRecord } from "./tool-invocation-record";

type ToolInvocationNode = {
  invocationId: string;
  toolName: string;
  record: ToolInvocationRecord;
};

type DependencyGraph = Map<string, ToolInvocationNode>;

export class ToolInvocationDependencyGraph {
  private nodes: DependencyGraph = new Map();
  private dependencies: Map<string, string[]> = new Map();

  private constructor() {}

  private static getInstance(): ToolInvocationDependencyGraph {
    if (!ToolInvocationDependencyGraph.instance) {
      ToolInvocationDependencyGraph.instance = new ToolInvocationDependencyGraph();
    }
    return ToolInvocationDependencyGraph.instance;
  }

  public static getInstance(): ToolInvocationDependencyGraph {
    return ToolInvocationDependencyGraph.getInstance();
  }

  private static instance: ToolInvocationDependencyGraph;

  private setNode(node: ToolInvocationNode) {
    this.nodes.set(node.invocationId, node);
  }

  private addDependency(sourceId: string, targetId: string) {
    if (!this.dependencies.has(sourceId)) {
      this.dependencies.set(sourceId, []);
    }
    const targets = this.dependencies.get(sourceId)!;
    if (!targets.includes(targetId)) {
      targets.push(targetId);
    }
  }

  public build(records: ToolInvocationRecord[]): void {
    this.nodes.clear();
    this.dependencies.clear();

    if (records.length === 0) {
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const invocationId = record.invocationId;
      const toolName = record.toolName;

      const node: ToolInvocationNode = {
        invocationId: invocationId,
        toolName: toolName,
        record: record,
      };
      this.setNode(node);

      if (i > 0) {
        const previousRecord = records[i - 1];
        // Simple dependency: current tool depends on the output of the previous tool
        // In a real scenario, this would require mapping specific output keys.
        // Here, we assume sequential dependency for visualization purposes.
        const previousInvocationId = previousRecord.invocationId;
        this.addDependency(previousInvocationId, invocationId);
      }
    }
  }

  public getNode(invocationId: string): ToolInvocationNode | undefined {
    return this.nodes.get(invocationId);
  }

  public getDependencies(invocationId: string): string[] {
    return this.dependencies.get(invocationId) || [];
  }

  public getNodes(): ToolInvocationNode[] {
    return Array.from(this.nodes.values());
  }

  public visualizeFlow(): string {
    let output = "--- Tool Invocation Dependency Flow ---\n";
    const sortedNodes = this.getNodes().sort((a, b) => 
      Math.min(a.record.timestamp || 0, b.record.timestamp || 0) - 
      Math.min(a.record.timestamp || 0, b.record.timestamp || 0)
    );

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      output += `\n[${i + 1}] Tool: ${node.toolName} (ID: ${node.invocationId})\n`;
      output += `  Input Source: ${i > 0 ? sortedNodes[i - 1].invocationId : "Initial Prompt"}\n`;
      output += `  Output Dependency: ${this.getDependencies(node.invocationId).join(" -> ")}\n`;
    }
    return output;
  }
}