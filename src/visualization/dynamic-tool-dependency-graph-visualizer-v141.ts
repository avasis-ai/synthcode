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

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  dependencies: string[];
}

interface GraphVisualization {
  nodes: { id: string; label: string; metadata: Record<string, any> }[];
  edges: { source: string; target: string; weight: number; label: string }[];
}

export class DynamicToolDependencyGraphVisualizer {
  private toolDefinitions: Map<string, ToolDefinition>;

  constructor(toolDefinitions: ToolDefinition[]) {
    this.toolDefinitions = new Map(
      toolDefinitions.map((def) => [def.name, def])
    );
  }

  private checkSchemaCompatibility(
    sourceSchema: Record<string, any>,
    targetSchema: Record<string, any>
  ): boolean {
    // Simplified compatibility check: assumes all required keys in source
    // must exist or be compatible with target's expected input.
    const sourceKeys = Object.keys(sourceSchema);
    for (const key of sourceKeys) {
      if (typeof sourceSchema[key] === 'object' && sourceSchema[key] !== null) {
        // In a real scenario, deep schema comparison would happen here.
        // For this simulation, we just check for key existence.
        if (!(key in targetSchema)) {
          return false;
        }
      }
    }
    return true;
  }

  private buildGraph(
    initialContext: Record<string, any>
  ): GraphVisualization {
    const nodesMap = new Map<string, { id: string; label: string; metadata: Record<string, any> }>();
    const edges: { source: string; target: string; weight: number; label: string }[] = [];
    const visitedNodes = new Set<string>();
    const queue: { toolName: string; context: Record<string, any> }[] = [];

    // Initialize queue with tools that can run from the initial context
    for (const [name, definition] of this.toolDefinitions.entries()) {
      if (this.checkSchemaCompatibility(
        initialContext,
        definition.inputSchema
      )) {
        queue.push({ toolName: name, context: { ...initialContext } });
      }
    }

    const processQueue = (currentQueue: { toolName: string; context: Record<string, any> }[]) => {
      const newQueue: { toolName: string; context: Record<string, any> }[] = [];
      const processedNodes = new Set<string>();

      for (const { toolName: currentToolName, context: currentContext } of currentQueue) {
        if (processedNodes.has(currentToolName)) continue;

        const definition = this.toolDefinitions.get(currentToolName)!;

        // 1. Add Node
        if (!nodesMap.has(currentToolName)) {
          nodesMap.set(
            currentToolName,
            {
              id: currentToolName,
              label: `${currentToolName} (Input: ${JSON.stringify(definition.inputSchema)})`,
              metadata: {
                description: definition.description,
                dependencies: definition.dependencies,
              },
            }
          );
        }
        processedNodes.add(currentToolName);

        // 2. Add Edges from previous context/dependencies
        // (Simplified: Edges are drawn from the initial context source to the tool)
        // In a full implementation, edges would link Tool A Output -> Tool B Input
        if (currentContext) {
          // Edge from conceptual start/context to the current tool
          edges.push({
            source: "START",
            target: currentToolName,
            weight: 1,
            label: `Context available for ${currentToolName}`,
          });
        }

        // 3. Determine potential next steps (Successors)
        const potentialOutput = {
          ...currentContext,
          [currentToolName]: { output: "Simulated Output Data" },
        };

        for (const [nextToolName, nextDefinition] of this.toolDefinitions.entries()) {
          if (nextToolName === currentToolName) continue;

          // Check if the output of the current tool satisfies the input of the next tool
          if (this.checkSchemaCompatibility(
            potentialOutput,
            nextDefinition.inputSchema
          )) {
            // Found a potential path
            edges.push({
              source: currentToolName,
              target: nextToolName,
              weight: 1,
              label: `Data flow possible`,
            });
            // Add to the next iteration queue
            newQueue.push({
              toolName: nextToolName,
              context: { ...potentialOutput },
            });
          }
        }
      }
      return newQueue;
    };

    let currentQueue = queue;
    let iterationCount = 0;

    // BFS traversal to find all reachable nodes/paths
    while (currentQueue.length > 0 && iterationCount < 10) {
      const nextQueue = processQueue(currentQueue);
      currentQueue = nextQueue;
      iterationCount++;
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edges,
    };
  }

  /**
   * Analyzes all potential execution paths based on schema compatibility and dependencies.
   * @param initialContext The initial data context available at the start.
   * @returns A structured graph visualization object.
   */
  visualize(initialContext: Record<string, any>): GraphVisualization {
    return this.buildGraph(initialContext);
  }
}