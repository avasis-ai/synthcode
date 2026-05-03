import { ToolDefinition } from "./tool-definition";

export type CapabilityGraph = Map<string, {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}>;

export class DynamicCapabilityGraphBuilder {
  private toolDefinitions: ToolDefinition[];
  private toolCapabilities: Map<string, Set<string>>;

  constructor(toolDefinitions: ToolDefinition[], toolCapabilities: Map<string, Set<string>>) {
    this.toolDefinitions = toolDefinitions;
    this.toolCapabilities = toolCapabilities;
  }

  private getToolName(tool: ToolDefinition): string {
    return tool.name;
  }

  private getToolCapabilities(toolName: string): Set<string> {
    return this.toolCapabilities.get(toolName) || new Set<string>();
  }

  private buildGraphStructure(): CapabilityGraph {
    const graph: CapabilityGraph = new Map();

    for (const tool of this.toolDefinitions) {
      const toolName = this.getToolName(tool);
      if (!graph.has(toolName)) {
        graph.set(toolName, {
          nodes: new Set<string>(),
          edges: new Map<string, Set<string>>(),
        });
      }
    }
    return graph;
  }

  private addCapabilityNode(graph: CapabilityGraph, capability: string) {
    // In this simplified model, capabilities are implicitly nodes connected to tools.
    // We'll manage them by ensuring they are tracked if they are central to a relationship.
  }

  private addToolEdge(graph: CapabilityGraph, sourceToolName: string, targetToolName: string, relationship: "REQUIRES" | "SUPPORTS" | "CONFLICTS") {
    const sourceGraph = graph.get(sourceToolName);
    const targetGraph = graph.get(targetToolName);

    if (!sourceGraph || !targetGraph) {
      return;
    }

    if (!sourceGraph.edges.has(targetToolName)) {
      sourceGraph.edges.set(targetToolName, new Set<string>());
    }
    sourceGraph.edges.get(targetToolName)!.add(relationship);

    if (!targetGraph.edges.has(sourceToolName)) {
      targetGraph.edges.set(sourceToolName, new Set<string>());
    }
    targetGraph.edges.get(sourceToolName)!.add(relationship);
  }

  public buildGraph(): CapabilityGraph {
    const graph = this.buildGraphStructure();

    // 1. Populate Tool Capabilities (Nodes/Attributes)
    for (const tool of this.toolDefinitions) {
      const toolName = this.getToolName(tool);
      const capabilities = this.getToolCapabilities(toolName);
      if (capabilities.size > 0) {
        // For simplicity, we treat the tool name itself as the primary node,
        // and capabilities are attributes/relationships.
        // We'll add capability nodes explicitly for overlap/conflict analysis.
        for (const cap of capabilities) {
          // We don't add capability nodes to the primary graph map keys,
          // but we ensure they are tracked conceptually.
        }
      }
    }

    // 2. Analyze Dependencies (Tool A requires Tool B)
    for (let i = 0; i < this.toolDefinitions.length; i++) {
      for (let j = 0; j < this.toolDefinitions.length; j++) {
        if (i === j) continue;

        const toolA = this.toolDefinitions[i];
        const toolB = this.toolDefinitions[j];
        const nameA = this.getToolName(toolA);
        const nameB = this.getToolName(toolB);

        // Check explicit dependencies defined in ToolDefinition (if applicable)
        if (toolA.dependencies?.includes(nameB)) {
          this.addToolEdge(graph, nameA, nameB, "REQUIRES");
        }
      }
    }

    // 3. Analyze Capability Overlap and Conflicts
    const toolNames = this.toolDefinitions.map(this.getToolName);
    for (let i = 0; i < toolNames.length; i++) {
      for (let j = i + 1; j < toolNames.length; j++) {
        const nameA = toolNames[i];
        const nameB = toolNames[j];

        const capsA = this.getToolCapabilities(nameA);
        const capsB = this.getToolCapabilities(nameB);

        if (capsA.size === 0 || capsB.size === 0) continue;

        // Overlap Check (Intersection)
        let overlapCount = 0;
        for (const capA of capsA) {
          if (capsB.has(capA)) {
            overlapCount++;
          }
        }

        if (overlapCount > 0) {
          // Overlap suggests compatibility or shared utility
          this.addToolEdge(graph, nameA, nameB, "SUPPORTS");
        }

        // Conflict Check (Hypothetical: Requires external conflict logic,
        // here we simulate conflict if they share a specific 'conflict' capability)
        const conflictCapability = "CONFLICT_RESOURCE";
        if (capsA.has(conflictCapability) && capsB.has(conflictCapability)) {
          this.addToolEdge(graph, nameA, nameB, "CONFLICTS");
        }
      }
    }

    return graph;
  }
}