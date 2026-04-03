import type { Tool, APIToolDefinition } from './tool.js';

/** Registry for managing tool lookup and deduplication. */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  constructor(tools?: Tool[]) {
    if (tools) {
      for (const tool of tools) {
        this.add(tool);
      }
    }
  }

  /** Add a tool to the registry. Duplicate names are ignored (first one wins). */
  add(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Duplicate tool "${tool.name}" ignored (first one wins)`);
      return;
    }
    this.tools.set(tool.name, tool);
  }

  /** Get a tool by name. */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** Check if a tool exists by name. */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Find tool by case-insensitive name. Returns undefined if not found. */
  findCaseInsensitive(name: string): string | undefined {
    const lower = name.toLowerCase();
    if (this.tools.has(name)) return name;
    for (const key of this.tools.keys()) {
      if (key.toLowerCase() === lower) return key;
    }
    return undefined;
  }

  /** List all registered tool names. */
  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /** Get all registered tools. */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /** Get all tools in API format, sorted by name for cache stability. */
  getAPI(): APIToolDefinition[] {
    return this.getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => t.toAPI());
  }

  /** Number of registered tools. */
  get size(): number {
    return this.tools.size;
  }
}
