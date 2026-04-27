import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ToolCapability {
  name: string;
  description: string;
  requiredPermissions: string[];
  expectedOutputSchema: Record<string, any>;
  failureModes: string[];
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  capability: ToolCapability;
  // Placeholder for actual execution logic, not used in registry itself
  execute: (input: Record<string, unknown>) => Promise<any>;
}

export class CapabilityRegistry {
  private capabilities: Map<string, ToolCapability> = new Map();

  constructor() {}

  registerTool(tool: ToolDefinition): void {
    if (this.capabilities.has(tool.name)) {
      throw new Error(`CapabilityRegistry: Tool "${tool.name}" is already registered.`);
    }
    this.capabilities.set(tool.name, tool.capability);
  }

  getCapability(toolName: string): ToolCapability | undefined {
    return this.capabilities.get(toolName);
  }

  getAvailableToolNames(): Set<string> {
    return new Set(this.capabilities.keys());
  }

  /**
   * Filters available tools based on required capabilities for a given context.
   * @param requiredPermissions Permissions the current context must possess.
   * @returns An array of tool names that meet all specified criteria.
   */
  filterToolsByContext(requiredPermissions: string[]): string[] {
    const matchingTools: string[] = [];
    for (const [name, capability] of this.capabilities.entries()) {
      const hasAllPermissions = requiredPermissions.every(
        (permission) => capability.requiredPermissions.includes(permission)
      );
      if (hasAllPermissions) {
        matchingTools.push(name);
      }
    }
    return matchingTools;
  }
}