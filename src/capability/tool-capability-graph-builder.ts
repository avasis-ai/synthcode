import { Capability, ToolDefinition } from "./types";

export type CapabilityEdge = {
  sourceToolId: string;
  requiredCapability: Capability;
  providingCapability: Capability;
};

export interface CapabilityGraph {
  tools: Map<string, ToolDefinition>;
  capabilitiesProvided: Map<string, Capability[]>;
  capabilityEdges: CapabilityEdge[];
}

export class ToolCapabilityGraphBuilder {
  private tools: Map<string, ToolDefinition> = new Map();
  private capabilityEdges: CapabilityEdge[] = [];
  private toolCapabilityMap: Map<string, Set<Capability>> = new Map();

  addTool(toolDef: ToolDefinition): void {
    this.tools.set(toolDef.id, toolDef);
    this.toolCapabilityMap.set(toolDef.id, new Set());
  }

  addCapabilityLink(toolId: string, required: Capability, provided: Capability): void {
    if (!this.tools.has(toolId)) {
      throw new Error(`Tool with ID ${toolId} not found.`);
    }
    this.capabilityEdges.push({
      sourceToolId: toolId,
      requiredCapability: required,
      providingCapability: provided,
    });
    this.toolCapabilityMap.get(toolId)!.add(provided);
  }

  buildGraph(): CapabilityGraph {
    const capabilitiesProvided = new Map<string, Capability[]>();
    for (const [toolId, providedCaps] of this.toolCapabilityMap.entries()) {
      capabilitiesProvided.set(toolId, Array.from(providedCaps));
    }

    return {
      tools: new Map(this.tools),
      capabilitiesProvided: capabilitiesProvided,
      capabilityEdges: [...this.capabilityEdges],
    };
  }
}