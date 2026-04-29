import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ToolInvocation {
  toolName: string;
  toolId: string;
  startTime: number;
  endTime: number;
  requiredResources: Record<string, number>;
  dependencies: string[];
}

export interface DependencyGraphData {
  invocations: ToolInvocation[];
  messageHistory: Message[];
}

export class ToolInvocationDependencyGraphVisualizer {
  private data: DependencyGraphData;

  constructor(data: DependencyGraphData) {
    this.data = data;
  }

  private extractToolInvocations(): ToolInvocation[] {
    const invocations: ToolInvocation[] = [];
    let invocationCounter = 0;

    this.data.messageHistory.forEach((message, index) => {
      if (message.role === "tool" && (message as ToolResultMessage).tool_use_id) {
        const toolResult = message as ToolResultMessage;
        // Simplified extraction: Assume tool result implies a preceding invocation
        // In a real system, the invocation metadata would be richer.
        // Here we simulate based on the structure.
        const invocation: ToolInvocation = {
          toolName: "SimulatedTool",
          toolId: toolResult.tool_use_id,
          startTime: index * 1000, // Placeholder time
          endTime: index * 1000 + 5000, // Placeholder time
          requiredResources: { cpu: 1, memory: 2 },
          dependencies: [],
        };
        invocations.push(invocation);
        invocationCounter++;
      }
    });
    return invocations;
  }

  private buildDependencies(invocations: ToolInvocation[]): Map<string, Set<string>> {
    const dependencyMap = new Map<string, Set<string>>();

    invocations.forEach((inv, i) => {
      const sourceId = `inv_${i}`;
      dependencyMap.set(sourceId, new Set(inv.dependencies));
    });

    return dependencyMap;
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const invocations = this.extractToolInvocations();
    const dependencyMap = this.buildDependencies(invocations);

    const nodes: any[] = invocations.map((inv, index) => ({
      id: `tool_inv_${index}`,
      label: `${inv.toolName} (${inv.toolId})`,
      type: "tool_invocation",
      data: {
        startTime: inv.startTime,
        endTime: inv.endTime,
        resources: inv.requiredResources,
        dependencies: inv.dependencies,
      },
      // Visualization specific properties (e.g., bounding box for time)
      vizProps: {
        x: index * 200,
        y: 0,
        width: 150,
        height: 50,
      },
    }));

    const edges: any[] = [];
    for (let i = 0; i < invocations.length; i++) {
      const sourceId = `tool_inv_${i}`;
      const sourceInv = invocations[i];
      const dependencies = dependencyMap.get(sourceId) || new Set<string>();

      dependencies.forEach(depId => {
        // In a real graph, we'd map depId back to a node ID.
        // Here we simulate an edge based on the dependency string.
        edges.push({
          source: sourceId,
          target: `dep_${depId}`, // Target might be another invocation or a conceptual step
          type: "dependency",
          metadata: {
            reason: `Depends on ${depId}`,
          },
        });
      });
    }

    return { nodes, edges };
  }
}