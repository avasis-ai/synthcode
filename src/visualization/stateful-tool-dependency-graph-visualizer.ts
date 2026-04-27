import {
  ToolInvocationRecord,
  GraphStateUpdate,
  ToolUseBlock,
  TextBlock,
  ThinkingBlock,
} from "./types";

export class StatefulToolDependencyGraphVisualizer {
  private history: ToolInvocationRecord[] = [];

  constructor() {}

  public loadHistory(records: ToolInvocationRecord[]): void {
    this.history = records;
  }

  public processUpdates(): GraphStateUpdate[] {
    if (this.history.length === 0) {
      return [];
    }

    const updates: GraphStateUpdate[] = [];
    let currentState: Map<string, any> = new Map();

    for (let i = 0; i < this.history.length; i++) {
      const record = this.history[i];
      const timestamp = i;

      // Simulate state extraction and update for the current record
      const nodeUpdates: { nodeId: string; state: any; timestamp: number }[] = [];
      const edgeUpdates: { sourceId: string; targetId: string; state: any; timestamp: number }[] = [];

      // Simplified logic: Assume each tool use generates a node and potential edges
      if (record.tool_calls && record.tool_calls.length > 0) {
        record.tool_calls.forEach((call, index) => {
          const nodeId = `${record.tool_use_id}-${index}`;
          
          // Node State Update
          nodeUpdates.push({
            nodeId: nodeId,
            state: {
              toolName: call.name,
              input: call.input,
              invocationTime: timestamp,
            },
            timestamp: timestamp,
          });

          // Edge Update (Dependency from previous step/user input to this tool call)
          const sourceId = record.tool_use_id || "initial_state";
          edgeUpdates.push({
            sourceId: sourceId,
            targetId: nodeId,
            state: {
              dependencyType: "tool_call",
              timestamp: timestamp,
            },
            timestamp: timestamp,
          });
        });
      }

      // Aggregate updates for this time step
      updates.push({
        nodeUpdates: nodeUpdates,
        edgeUpdates: edgeUpdates,
        timestamp: timestamp,
      });

      // Update global state map (simplified)
      this.updateState(currentState, record);
    }

    return updates;
  }

  private updateState(currentState: Map<string, any>, record: ToolInvocationRecord): void {
    // In a real implementation, this would merge complex state changes.
    // For this example, we just mark the record as processed.
    currentState.set(`record_${record.tool_use_id}`, {
      lastProcessed: Date.now(),
      toolCalls: record.tool_calls?.length || 0,
    });
  }

  /**
   * Generates the structured data required for rendering the temporal graph.
   * @returns An array of GraphStateUpdate objects.
   */
  public getVisualData(): GraphStateUpdate[] {
    return this.processUpdates();
  }
}