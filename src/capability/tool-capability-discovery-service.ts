import { AgentContext, Message } from "./agent-context";

export interface CapabilityDescriptor {
  name: string;
  description: string;
  keywords: string[];
  sourceToolName: string;
}

export interface CapabilityList {
  capabilities: CapabilityDescriptor[];
  discoveredAt: Date;
}

export class ToolCapabilityDiscoveryService {
  private toolDefinitions: { name: string; description: string; metadata?: Record<string, any> }[];

  constructor(toolDefinitions: { name: string; description: string; metadata?: Record<string, any> }[]) {
    this.toolDefinitions = toolDefinitions;
  }

  private extractCapabilitiesFromTool(tool: { name: string; description: string; metadata?: Record<string, any> }): CapabilityDescriptor[] {
    const capabilities: CapabilityDescriptor[] = [];

    // Simple heuristic: Check for explicit capability markers in metadata or description
    const extractFromText = (text: string, source: string): CapabilityDescriptor[] => {
      const found: CapabilityDescriptor[] = [];
      // Example: Look for patterns like "[CAPABILITY:can_fetch_weather]"
      const regex = /\[CAPABILITY:([a-zA-Z0-9_]+)\]/g;
      let match: RegExpExecArray | null = regex.exec(text);
      while (match) {
        const capabilityName = match[1];
        found.push({
          name: capabilityName,
          description: `Discovered capability: ${capabilityName}. Derived from tool ${source}.`,
          keywords: [capabilityName],
          sourceToolName: source,
        });
        match = regex.exec(text);
      }
      return found;
    };

    // 1. Check metadata for explicit capabilities
    if (tool.metadata?.capabilities) {
      (tool.metadata.capabilities as string[]).forEach(cap => {
        capabilities.push({
          name: cap,
          description: `Explicitly declared capability: ${cap}.`,
          keywords: [cap],
          sourceToolName: tool.name,
        });
      });
    }

    // 2. Check description for embedded markers
    capabilities.push(...extractFromText(tool.description, tool.name));

    return capabilities;
  }

  public async discoverCapabilities(context: AgentContext): Promise<CapabilityList> {
    let allCapabilities: CapabilityDescriptor[] = [];

    for (const tool of this.toolDefinitions) {
      const toolCaps = this.extractCapabilitiesFromTool(tool);
      allCapabilities.push(...toolCaps);
    }

    // Filter and refine based on context (e.g., user intent keywords)
    const filteredCapabilities = allCapabilities.filter(cap => {
      if (!context.userIntent || !context.userIntent.keywords) {
        return true; // No context filtering applied
      }
      const contextKeywords = context.userIntent.keywords.map(k => k.toLowerCase());
      const capKeywords = cap.keywords.map(k => k.toLowerCase());

      // Keep capability if any context keyword matches any capability keyword
      return contextKeywords.some(contextKey =>
        capKeywords.some(capKey => contextKey.includes(capKey) || capKey.includes(contextKey))
      );
    });

    return {
      capabilities: filteredCapabilities,
      discoveredAt: new Date(),
    };
  }
}