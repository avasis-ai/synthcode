import { ToolRegistry, ToolUseBlock, Message } from "./tool-registry";

type ToolName = string;
type Version = string;

interface ToolDefinition {
  name: ToolName;
  description: string;
  versions: Record<Version, {
    functionName: string;
    schema: Record<string, any>;
    implementation: (input: Record<string, unknown>) => Promise<any>;
  }>;
}

interface DeprecationInfo {
  isDeprecated: boolean;
  deprecationMessage: string;
  replacementToolName: ToolName | null;
  effectiveDate: Date;
}

export class ToolVersionLifecycleManager {
  private registry: ToolRegistry;
  private toolDefinitions: Map<ToolName, ToolDefinition> = new Map();
  private deprecationStatus: Map<ToolName, DeprecationInfo> = new Map();

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  registerTool(toolName: ToolName, definition: ToolDefinition): void {
    if (this.toolDefinitions.has(toolName)) {
      throw new Error(`Tool ${toolName} is already registered.`);
    }
    this.toolDefinitions.set(toolName, definition);
    this.deprecationStatus.set(toolName, {
      isDeprecated: false,
      deprecationMessage: "",
      replacementToolName: null,
      effectiveDate: new Date(0),
    });
  }

  markToolAsDeprecated(
    toolName: ToolName,
    message: string,
    replacementToolName: ToolName,
    effectiveDate: Date = new Date()
  ): void {
    if (!this.toolDefinitions.has(toolName)) {
      throw new Error(`Cannot deprecate unknown tool: ${toolName}`);
    }
    this.deprecationStatus.set(toolName, {
      isDeprecated: true,
      deprecationMessage: message,
      replacementToolName: replacementToolName,
      effectiveDate: effectiveDate,
    });
  }

  getDeprecationStatus(toolName: ToolName): DeprecationInfo | undefined {
    return this.deprecationStatus.get(toolName);
  }

  async executeToolCall(
    toolUseBlock: ToolUseBlock,
    input: Record<string, unknown>
  ): Promise<{ toolUseId: string; result: any }> {
    const toolName = toolUseBlock.name;
    const status = this.getDeprecationStatus(toolName);

    if (status?.isDeprecated) {
      const warningMessage = `WARNING: Tool "${toolName}" is deprecated. ${status.deprecationMessage} Consider using "${status.replacementToolName}".`;
      console.warn(warningMessage);
      
      // Decide policy: Fail, or proceed with warning. We proceed with warning for graceful degradation.
    }

    const definition = this.toolDefinitions.get(toolName);
    if (!definition) {
      throw new Error(`Tool definition not found for ${toolName}`);
    }

    // Assume we always execute the latest version for simplicity in this manager
    const latestVersionKey = Object.keys(definition.versions).pop() || "v1";
    const versionedTool = definition.versions[latestVersionKey];

    if (!versionedTool || typeof versionedTool.implementation !== 'function') {
      throw new Error(`Tool implementation missing for ${toolName}`);
    }

    const result = await versionedTool.implementation(input);

    return {
      toolUseId: toolUseBlock.id,
      result: result,
    };
  }
}