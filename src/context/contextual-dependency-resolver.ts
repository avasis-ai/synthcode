import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
}

export interface ResolverContext {
  messages: Message[];
  availableTools: Record<string, ToolDefinition>;
  requiredInputs: Record<string, { source: "context" | "tool_output"; required: boolean }>;
}

export interface ResolvedStep {
  toolName: string;
  inputs: Record<string, unknown>;
  reason: string;
}

export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

export type ResolverResult = {
  steps: ResolvedStep[];
  finalContext: Record<string, any>;
}

export class ContextualDependencyResolver {
  private context: ResolverContext;

  constructor(context: ResolverContext) {
    this.context = context;
  }

  private buildDependencyGraph(): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Set<string>(),
      edges: new Map<string, Set<string>>(),
    };

    const { availableTools, requiredInputs } = this.context;

    // Nodes are tools and required inputs
    for (const toolName of Object.keys(availableTools)) {
      graph.nodes.add(toolName);
    }
    for (const inputKey of Object.keys(requiredInputs)) {
      graph.nodes.add(`INPUT:${inputKey}`);
    }

    // Simple edge creation: If a tool requires an input, draw an edge from INPUT to TOOL
    for (const [inputKey, { required }] of Object.entries(requiredInputs)) {
      if (required) {
        // Assume any tool that *might* need this input depends on it.
        // In a real system, this mapping would be explicit.
        // For simulation, we link all tools to all required inputs.
        for (const toolName of Object.keys(availableTools)) {
          graph.edges.set(toolName, graph.edges.get(toolName) || new Set<string>());
          graph.edges.get(toolName)!.add(`INPUT:${inputKey}`);
        }
      }
    }

    return graph;
  }

  private heuristic(node: string): number {
    // Simple heuristic: prioritize nodes that are required inputs and are currently missing.
    if (node.startsWith("INPUT:")) {
      const inputKey = node.substring("INPUT:".length);
      if (this.context.requiredInputs[inputKey]?.required && !this.isContextAvailable(inputKey)) {
        return 100; // High priority for missing required context
      }
    }
    // Lower priority for tools that don't depend on missing context
    return 1;
  }

  private isContextAvailable(inputKey: string): boolean {
    // Placeholder: Check if the input is present in the current message history or context store
    return this.context.messages.some(msg => msg.content.includes(inputKey));
  }

  private findNextBestStep(graph: DependencyGraph, visited: Set<string>): { step: ResolvedStep, score: number } | null {
    let bestScore = -1;
    let bestStep: ResolvedStep | null = null;

    for (const toolName of Array.from(graph.nodes).filter(n => n.startsWith("TOOL:") && !visited.has(n))) {
      const toolKey = toolName.substring("TOOL:".length);
      const toolDef = this.context.availableTools[toolKey];

      if (!toolDef) continue;

      // Check dependencies for this tool
      const requiredDependencies = new Set<string>();
      // In a real implementation, we'd parse toolDef.parameters against requiredInputs
      // For simulation, we assume if the tool is considered, we check its inputs.
      
      // Simplified check: If the tool requires any input that is missing, it's a candidate.
      let canExecute = true;
      let requiredInputsForTool: Record<string, unknown> = {};
      
      // Placeholder logic: Assume the tool needs inputs matching the requiredInputs keys
      for (const [inputKey, { required }] of Object.entries(this.context.requiredInputs)) {
          if (required && !this.isContextAvailable(inputKey)) {
              // If we are missing a required input, this tool might depend on it.
              requiredInputsForTool[inputKey] = "MISSING_CONTEXT";
              canExecute = false; // Cannot execute yet
          } else {
              requiredInputsForTool[inputKey] = "AVAILABLE";
          }
      }

      if (canExecute) {
        // Calculate score based on heuristic and potential information gain
        const score = this.heuristic(toolKey) * 10 + 1; // Simple scoring
        
        if (score > bestScore) {
          bestScore = score;
          bestStep = {
            toolName: toolKey,
            inputs: requiredInputsForTool,
            reason: `High priority step: ${toolKey} seems ready or unlocks critical path.`,
          };
        }
      }
    }
    return bestStep ? { step: bestStep, score: bestScore } : null;
  }

  public resolve(): ResolverResult {
    let graph = this.buildDependencyGraph();
    let steps: ResolvedStep[] = [];
    let currentContext: Record<string, any> = {};
    const visitedNodes = new Set<string>();

    while (true) {
      const bestCandidate = this.findNextBestStep(graph, visitedNodes);

      if (!bestCandidate) {
        break;
      }

      const { step } = bestCandidate;
      
      // Simulate execution and update context
      steps.push(step);
      visitedNodes.add(`TOOL:${step.toolName}`);
      
      // Simulate context update based on the step taken
      currentContext[step.toolName] = { status: "EXECUTED", inputs: step.inputs };
      
      // In a real scenario, we would call the tool and update context with the result.
    }

    return {
      steps: steps,
      finalContext: currentContext,
    };
  }
}