import { Message, ToolUseBlock, ContentBlock, TextBlock, ThinkingBlock } from "./types";

interface ToolCallGraphNode {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  dependencies: Set<string>;
  conflicts: Set<string>;
}

interface ValidationResult {
  isValid: boolean;
  conflicts: ConflictDetail[];
  suggestions: string[];
}

interface ConflictDetail {
  type: "ResourceContention" | "LogicalContradiction" | "DependencyCycle";
  description: string;
  affectedNodes: { id: string; name: string }[];
  suggestedResolution: string;
}

export class ContextualToolCallValidator {
  private nodes: Map<string, ToolCallGraphNode> = new Map();
  private messageHistory: Message[] = [];

  constructor(private readonly maxDepth: number = 5) {}

  public validate(messages: Message[]): ValidationResult {
    this.messageHistory = messages;
    this.nodes.clear();

    const toolCalls = this.extractToolCalls(messages);
    if (toolCalls.length === 0) {
      return { isValid: true, conflicts: [], suggestions: [] };
    }

    this.buildGraph(toolCalls);
    const conflicts = this.detectConflicts();

    const result: ValidationResult = {
      isValid: conflicts.length === 0,
      conflicts: conflicts,
      suggestions: this.generateSuggestions(conflicts),
    };

    return result;
  }

  private extractToolCalls(messages: Message[]): { id: string; name: string; input: Record<string, unknown> }[] {
    const toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    for (const message of messages) {
      if (message.role === "assistant") {
        const contentBlocks = message.content as ContentBlock[];
        for (const block of contentBlocks) {
          if (block.type === "tool_use") {
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
        }
      }
    }
    return toolCalls;
  }

  private buildGraph(toolCalls: { id: string; name: string; input: Record<string, unknown> }[]): void {
    for (const call of toolCalls) {
      const node: ToolCallGraphNode = {
        toolUseId: call.id,
        toolName: call.name,
        input: call.input,
        dependencies: new Set(),
        conflicts: new Set(),
      };
      this.nodes.set(call.id, node);
    }

    // Simulate dependency mapping based on context (simplified for this implementation)
    // In a real system, this would involve analyzing the content leading up to the call.
    // For demonstration, we assume sequential calls might depend on the output of the previous one.
    for (let i = 0; i < toolCalls.length - 1; i++) {
      const currentId = toolCalls[i].id;
      const nextId = toolCalls[i + 1].id;
      const currentNode = this.nodes.get(currentId)!;
      currentNode.dependencies.add(nextId);
    }
  }

  private detectConflicts(): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    const nodeArray = Array.from(this.nodes.values());

    // 1. Resource Contention Check (Simulated)
    const resourceUsage: Map<string, string[]> = new Map(); // ResourceName -> [ToolUseId, ...]
    for (const node of nodeArray) {
      // Simulate resource requirement based on tool name/input
      const requiredResource = node.toolName.toLowerCase().includes("write") ? "database_write" : "read_access";
      if (!resourceUsage.has(requiredResource)) {
        resourceUsage.set(requiredResource, []);
      }
      resourceUsage.get(requiredResource)!.push(node.toolUseId);
    }

    for (const [resource, ids] of resourceUsage.entries()) {
      if (ids.length > 1 && resource === "database_write") {
        conflicts.push({
          type: "ResourceContention",
          description: `Multiple tools (${ids.join(', ')}) attempt exclusive write access to resource: ${resource}.`,
          affectedNodes: ids.map(id => ({ id, name: this.nodes.get(id)!.toolName })),
          suggestedResolution: "Sequence the calls or refactor to use read-only operations where possible.",
        });
      }
    }

    // 2. Dependency Cycle Check (Graph Traversal)
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();

    for (const node of nodeArray) {
      if (!visited.has(node.toolUseId)) {
        const cycle = this.detectCycleDFS(node.toolUseId, visited, recursionStack);
        if (cycle) {
          conflicts.push({
            type: "DependencyCycle",
            description: `Detected circular dependency involving tool calls: ${cycle.join(" -> ")}`,
            affectedNodes: cycle.map(id => ({ id, name: this.nodes.get(id)!.toolName })),
            suggestedResolution: "Review the call sequence to break the circular dependency.",
          });
        }
      }
    }

    // 3. Logical Contradiction Check (Highly Abstracted)
    // Example: Calling 'get_user_data' then immediately calling 'create_user' with conflicting data.
    if (nodeArray.length >= 2) {
      const firstNode = nodeArray[0];
      const lastNode = nodeArray[nodeArray.length - 1];
      if (firstNode.toolName.includes("get") && lastNode.toolName.includes("create")) {
        conflicts.push({
          type: "LogicalContradiction",
          description: `Potential contradiction: Reading data via '${firstNode.toolName}' and immediately attempting to create data via '${lastNode.toolName}' without explicit transformation/validation step.`,
          affectedNodes: [
            { id: firstNode.toolUseId, name: firstNode.toolName },
            { id: lastNode.toolUseId, name: lastNode.toolName },
          ],
          suggestedResolution: "Insert an explicit 'data_transformation' step or validation call between these two actions.",
        });
      }
    }

    return conflicts;
  }

  private detectCycleDFS(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = this.nodes.get(nodeId)!;
    const neighbors = Array.from(node.dependencies);

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        const cycle = this.detectCycleDFS(neighborId, visited, recursionStack);
        if (cycle) return cycle;
      } else if (recursionStack.has(neighborId)) {
        // Cycle detected
        const cycle: string[] = [neighborId, ...Array.from(cycle).filter(id => id !== neighborId)];
        return cycle;
      }
    }

    recursionStack.delete(nodeId);
    return null;
  }

  private generateSuggestions(conflicts: ConflictDetail[]): string[] {
    const suggestions: string[] = [];
    if (conflicts.some(c => c.type === "ResourceContention")) {
      suggestions.push("Review resource access patterns. Consider using optimistic locking or transaction boundaries.");
    }
    if (conflicts.some(c => c.type === "DependencyCycle")) {
      suggestions.push("Examine the flow graph for circular dependencies. The process must be linearized.");
    }
    if (conflicts.some(c => c.type === "LogicalContradiction")) {
      suggestions.push("Add explicit intermediate steps (e.g., 'validate_schema', 'transform_data') to bridge logical gaps between tool calls.");
    }
    return suggestions;
  }
}