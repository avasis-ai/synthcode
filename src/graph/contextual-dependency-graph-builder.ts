import { AgentContext, ContextualDependencyEdge, ContextualDependencyGraph, Message } from "./types";

export class ContextualDependencyGraphBuilder {
  private context: AgentContext;
  private potentialSteps: Message[];

  constructor(context: AgentContext, potentialSteps: Message[]) {
    this.context = context;
    this.potentialSteps = potentialSteps;
  }

  private analyzeMemoryDependencies(): ContextualDependencyEdge[] {
    const memoryEdges: ContextualDependencyEdge[] = [];
    if (this.context.memoryHistory && this.context.memoryHistory.length > 0) {
      for (const memoryItem of this.context.memoryHistory) {
        // Simplified: Assume memory retrieval directly influences the next step's context
        memoryEdges.push({
          source: "Memory",
          sourceId: `memory:${memoryItem.id}`,
          target: "ToolInput",
          targetId: "ToolCallInput",
          relationship: "InformedBy",
          description: `Contextual dependency from memory item: ${memoryItem.summary}`,
        });
      }
    }
    return memoryEdges;
  }

  private analyzeConstraintDependencies(): ContextualDependencyEdge[] {
    const constraintEdges: ContextualDependencyEdge[] = [];
    if (this.context.activeConstraints && this.context.activeConstraints.length > 0) {
      for (const constraint of this.context.activeConstraints) {
        // Simplified: Assume constraints guide the tool selection
        constraintEdges.push({
          source: "Constraint",
          sourceId: `constraint:${constraint.name}`,
          target: "ToolSelection",
          targetId: "ToolChoice",
          relationship: "ConstrainedBy",
          description: `Tool selection restricted by active constraint: ${constraint.name}`,
        });
      }
    }
    return constraintEdges;
  }

  private analyzeContextualFlow(step: Message): ContextualDependencyEdge[] {
    const edges: ContextualDependencyEdge[] = [];
    if (step.role === "tool" && step.content && typeof step.content === 'string') {
      // Example: Tool result content influences subsequent thinking/tool calls
      edges.push({
        source: "ToolOutput",
        sourceId: `tool_result:${step.tool_use_id}`,
        target: "NextStepInput",
        targetId: "ContextUpdate",
        relationship: "UpdatedContextWith",
        description: `Tool result updated context with data from ${step.tool_use_id}`,
      });
    }
    return edges;
  }

  public build(): ContextualDependencyGraph {
    const explicitEdges: ContextualDependencyEdge[] = [];
    const contextualEdges: ContextualDependencyEdge[] = [];

    // 1. Analyze explicit dependencies from potential steps (Tool Calls/Data Flow)
    for (const step of this.potentialSteps) {
      if (step.role === "assistant") {
        const toolUses = (step as any).content?.filter((block: any) => block.type === "tool_use");
        for (const toolUse of toolUses) {
          explicitEdges.push({
            source: "AgentThought",
            sourceId: "PreviousStep",
            target: "ToolCall",
            targetId: toolUse.id,
            relationship: "Invoked",
            description: `Agent decided to use tool ${toolUse.name} with input ${JSON.stringify(toolUse.input)}`,
          });
        }
      }
      // Add more logic for explicit data flow analysis here
    }

    // 2. Analyze contextual dependencies
    const memoryEdges = this.analyzeMemoryDependencies();
    const constraintEdges = this.analyzeConstraintDependencies();

    // 3. Aggregate all edges
    const allEdges: ContextualDependencyEdge[] = [
      ...explicitEdges,
      ...memoryEdges,
      ...constraintEdges,
    ];

    return {
      nodes: this.generateNodes(allEdges),
      edges: allEdges,
    };
  }

  private generateNodes(edges: ContextualDependencyEdge[]): Record<string, any> {
    const nodes: Record<string, any> = {};
    const nodeIds = new Set<string>();

    for (const edge of edges) {
      nodeIds.add(edge.sourceId);
      nodeIds.add(edge.targetId);
    }

    for (const id of nodeIds) {
      if (!nodes[id]) {
        nodes[id] = { id: id, type: "ContextNode", label: id.split(':')[0] };
      }
    }
    return nodes;
  }
}