import { EventEmitter } from "events";

export interface ToolState {
  version: string;
  usageCount: number;
  lastUsed: number;
  status: "active" | "deprecated" | "archived";
  quotaLimit?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  version: string;
  // Add other necessary tool definition properties here
}

export class StatefulToolRegistry extends EventEmitter {
  private tools: Map<string, { definition: ToolDefinition; state: ToolState }>;

  constructor() {
    super();
    super.setMaxListeners(20);
  }

  registerTool(definition: ToolDefinition, initialState: Partial<ToolState> = {}): void {
    const name = definition.name;
    if (this.tools.has(name)) {
      throw new Error(`Tool "${name}" is already registered.`);
    }

    const defaultState: ToolState = {
      version: definition.version,
      usageCount: 0,
      lastUsed: Date.now(),
      status: "active",
    };

    const finalState: ToolState = {
      ...defaultState,
      ...initialState,
    } as ToolState;

    this.tools.set(name, {
      definition: definition,
      state: finalState,
    });
    this.emit("toolRegistered", name);
  }

  updateToolUsage(toolName: string): void {
    const toolEntry = this.tools.get(toolName);
    if (!toolEntry) {
      throw new Error(`Tool "${toolName}" is not registered.`);
    }

    const currentState = toolEntry.state;
    const newUsageCount = currentState.usageCount + 1;
    const newLastUsed = Date.now();

    const newState: ToolState = {
      ...currentState,
      usageCount: newUsageCount,
      lastUsed: newLastUsed,
    };

    const updatedEntry = {
      definition: toolEntry.definition,
      state: newState,
    };

    this.tools.set(toolName, updatedEntry);
    this.emit("toolUsed", toolName, newUsageCount);
  }

  checkAvailability(toolName: string, checkQuota: boolean = true): { available: boolean; reason: string; state: ToolState | undefined } {
    const toolEntry = this.tools.get(toolName);
    if (!toolEntry) {
      return { available: false, reason: "Tool not found.", state: undefined };
    }

    const state = toolEntry.state;

    if (state.status !== "active") {
      return { available: false, reason: `Tool is ${state.status}.`, state };
    }

    if (checkQuota && state.quotaLimit !== undefined && state.usageCount >= state.quotaLimit) {
      return { available: false, reason: "Usage quota exceeded.", state };
    }

    return { available: true, reason: "Tool is available.", state };
  }

  getToolDefinition(toolName: string): ToolDefinition | undefined {
    const toolEntry = this.tools.get(toolName);
    return toolEntry ? toolEntry.definition : undefined;
  }

  getToolState(toolName: string): ToolState | undefined {
    const toolEntry = this.tools.get(toolName);
    return toolEntry ? toolEntry.state : undefined;
  }

  listRegisteredTools(): { name: string; definition: ToolDefinition; state: ToolState }[] {
    const list: { name: string; definition: ToolDefinition; state: ToolState }[] = [];
    for (const [name, entry] of this.tools.entries()) {
      list.push({
        name: name,
        definition: entry.definition,
        state: entry.state,
      });
    }
    return list;
  }

  deprecateTool(toolName: string): void {
    const toolEntry = this.tools.get(toolName);
    if (!toolEntry) {
      throw new Error(`Tool "${toolName}" not found.`);
    }

    const currentState = toolEntry.state;
    const newState: ToolState = {
      ...currentState,
      status: "deprecated",
    };

    const updatedEntry = {
      definition: toolEntry.definition,
      state: newState,
    };

    this.tools.set(toolName, updatedEntry);
    this.emit("toolDeprecated", toolName);
  }
}